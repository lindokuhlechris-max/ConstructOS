import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, ProgressBar, CustomSelect } from './ui';
import { 
  Compass, Plus, Search, Filter, CheckCircle2, Clock, AlertCircle, 
  Layers, MapPin, Link2, Unlink, ExternalLink, Sparkles, Navigation, 
  HardHat, Calendar, Flag, CheckSquare, RefreshCw, ChevronRight, 
  FileSpreadsheet, ArrowRight, UserCheck, Users, ShieldCheck, Tag, 
  Trash2, Edit3, X, SlidersHorizontal, Check
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SurveySectionRecord, Activity, SubTask } from '../types';

interface SurveyTrackerViewProps {
  onOpenActivity?: (activityId: string) => void;
}

export function SurveyTrackerView({ onOpenActivity }: SurveyTrackerViewProps) {
  const { 
    surveyRecords, 
    addSurveyRecord, 
    updateSurveyRecord, 
    deleteSurveyRecord, 
    batchGenerateSurveySections,
    linkSurveyRecordToActivity,
    unlinkSurveyRecordFromActivity,
    activities,
    addActivity,
    projects,
    employees,
    userRole
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterLink, setFilterLink] = useState<'All' | 'Linked' | 'Unlinked'>('All');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SurveySectionRecord | null>(null);
  const [linkingRecordId, setLinkingRecordId] = useState<string | null>(null);
  const [selectedActivityToLink, setSelectedActivityToLink] = useState<string>('');
  
  // Launch Activity from Survey modal
  const [launchingRecord, setLaunchingRecord] = useState<SurveySectionRecord | null>(null);
  const [launchActivityName, setLaunchActivityName] = useState('');
  const [launchWorkPackage, setLaunchWorkPackage] = useState('Pipeline & Trenching');
  const [launchStartDate, setLaunchStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [launchEndDate, setLaunchEndDate] = useState('');

  // Single Add form
  const [spanName, setSpanName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  const [chainageStart, setChainageStart] = useState('CH 0+000');
  const [chainageEnd, setChainageEnd] = useState('CH 0+433');
  const [distanceMeters, setDistanceMeters] = useState<number>(433);
  const [completedMeters, setCompletedMeters] = useState<number>(433);
  const [status, setStatus] = useState<SurveySectionRecord['status']>('Completed');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSurveyors, setSelectedSurveyors] = useState<string[]>(['Dimi Maphanga', 'Refumuni Malungane']);
  const [peggingNotes, setPeggingNotes] = useState('Centerline stakes and 20m offset pegs established.');
  const [benchmarkRef, setBenchmarkRef] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [elevation, setElevation] = useState('1420m AMSL');

  // Batch generator form
  const [batchPrefix, setBatchPrefix] = useState('PTS');
  const [batchStartNum, setBatchStartNum] = useState<number>(1);
  const [batchEndNum, setBatchEndNum] = useState<number>(20);
  const [batchDefaultDist, setBatchDefaultDist] = useState<number>(433);
  const [batchSurveyors, setBatchSurveyors] = useState<string[]>(['Dimi Maphanga', 'Refumuni Malungane', 'Matume Mathebula', 'Phineas Ngomane']);

  // Corridor Analytics
  const totalCorridorMeters = useMemo(() => {
    return surveyRecords.reduce((sum, r) => sum + (Number(r.distanceMeters) || 0), 0);
  }, [surveyRecords]);

  const totalCompletedMeters = useMemo(() => {
    return surveyRecords.reduce((sum, r) => sum + (Number(r.completedMeters) || 0), 0);
  }, [surveyRecords]);

  const corridorProgressPct = totalCorridorMeters > 0 
    ? Math.round((totalCompletedMeters / totalCorridorMeters) * 100) 
    : 0;

  const completedSectionsCount = surveyRecords.filter(r => r.status === 'Completed').length;
  const inProgressSectionsCount = surveyRecords.filter(r => r.status === 'In Progress').length;
  const notStartedSectionsCount = surveyRecords.filter(r => r.status === 'Not Started').length;
  const linkedSectionsCount = surveyRecords.filter(r => !!r.linkedActivityId).length;
  const advanceReadyCount = surveyRecords.filter(r => r.status === 'Completed' && !r.linkedActivityId).length;

  // Filtered list
  const filteredRecords = useMemo(() => {
    return surveyRecords.filter(r => {
      const matchesSearch = 
        r.spanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.startPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.endPoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.chainageStart && r.chainageStart.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.chainageEnd && r.chainageEnd.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.surveyors && r.surveyors.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (r.peggingNotes && r.peggingNotes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'All' || r.status === filterStatus;

      const matchesLink = 
        filterLink === 'All' ||
        (filterLink === 'Linked' && !!r.linkedActivityId) ||
        (filterLink === 'Unlinked' && !r.linkedActivityId);

      return matchesSearch && matchesStatus && matchesLink;
    });
  }, [surveyRecords, searchTerm, filterStatus, filterLink]);

  const handleToggleComplete = (record: SurveySectionRecord) => {
    const nextStatus = record.status === 'Completed' ? 'In Progress' : 'Completed';
    const nextCompleted = nextStatus === 'Completed' ? record.distanceMeters : Math.round(record.distanceMeters * 0.5);
    updateSurveyRecord({
      ...record,
      status: nextStatus,
      completedMeters: nextCompleted,
      surveyDate: nextStatus === 'Completed' ? (record.surveyDate || new Date().toISOString().split('T')[0]) : record.surveyDate,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveSingleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spanName) return;

    const newRecord: SurveySectionRecord = {
      id: `SRV-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      projectId: projects[0]?.id || 'PRJ-001',
      spanName,
      startPoint: startPoint || spanName.split('-')[0]?.trim() || spanName,
      endPoint: endPoint || spanName.split('-')[1]?.trim() || '',
      chainageStart,
      chainageEnd,
      distanceMeters: Number(distanceMeters) || 0,
      completedMeters: status === 'Completed' ? Number(distanceMeters) : Number(completedMeters) || 0,
      status,
      surveyDate,
      surveyors: selectedSurveyors,
      peggingNotes,
      benchmarkRef,
      coordinates,
      elevation,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    addSurveyRecord(newRecord);
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    updateSurveyRecord(editingRecord);
    setEditingRecord(null);
  };

  const resetForm = () => {
    setSpanName('');
    setStartPoint('');
    setEndPoint('');
    setChainageStart('CH 0+000');
    setChainageEnd('CH 0+433');
    setDistanceMeters(433);
    setCompletedMeters(433);
    setStatus('Completed');
    setSurveyDate(new Date().toISOString().split('T')[0]);
    setSelectedSurveyors(['Dimi Maphanga', 'Refumuni Malungane']);
    setPeggingNotes('Centerline stakes and 20m offset pegs established.');
    setBenchmarkRef('');
    setCoordinates('');
    setElevation('1420m AMSL');
  };

  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (batchStartNum >= batchEndNum) return;

    const newRecords: SurveySectionRecord[] = [];
    for (let i = batchStartNum; i < batchEndNum; i++) {
      const sNum = i;
      const eNum = i + 1;
      const sPoint = `${batchPrefix} ${sNum}`;
      const ePoint = `${batchPrefix} ${eNum}`;
      const sName = `${sPoint} - ${ePoint}`;
      
      const chStart = `CH ${((i - 1) * (batchDefaultDist / 1000)).toFixed(3).replace('.', '+')}`;
      const chEnd = `CH ${(i * (batchDefaultDist / 1000)).toFixed(3).replace('.', '+')}`;

      newRecords.push({
        id: `SRV-${batchPrefix}-${sNum}-${eNum}-${Date.now().toString(36).substring(4)}`,
        projectId: projects[0]?.id || 'PRJ-001',
        spanName: sName,
        startPoint: sPoint,
        endPoint: ePoint,
        chainageStart: chStart,
        chainageEnd: chEnd,
        distanceMeters: batchDefaultDist,
        completedMeters: 0,
        status: 'Not Started',
        surveyors: batchSurveyors,
        peggingNotes: `Linear corridor survey stakes planned for ${sName} at 20m chainages.`,
        benchmarkRef: `BM-${batchPrefix}-${sNum}`,
        elevation: `${1420 + (i - 1) * 2}m AMSL`,
        updatedAt: new Date().toISOString().split('T')[0]
      });
    }

    batchGenerateSurveySections(newRecords);
    setIsBatchModalOpen(false);
  };

  const handleLinkSubmit = () => {
    if (!linkingRecordId || !selectedActivityToLink) return;
    linkSurveyRecordToActivity(linkingRecordId, selectedActivityToLink);
    setLinkingRecordId(null);
    setSelectedActivityToLink('');
  };

  const handleLaunchActivityFromSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!launchingRecord) return;

    const activityId = `ACT-${launchingRecord.spanName.replace(/\s+/g, '-').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newActivityName = launchActivityName || `${launchingRecord.spanName} Trench Excavation & Pipe Laying`;

    const surveySubtask: SubTask = {
      id: `ST-SURV-${Date.now().toString(36)}`,
      title: `Trench set-out (${launchingRecord.spanName})`,
      category: 'Surveying & Set-out',
      status: launchingRecord.status,
      targetQuantity: launchingRecord.distanceMeters,
      completedQuantity: launchingRecord.completedMeters,
      unit: 'm',
      assignedWorkers: launchingRecord.surveyors || [],
      isMilestone: true,
      milestoneCriteria: 'Centerline benchmarks & trench pegging verified by land surveyor',
      isLinkedDiscipline: true,
      linkedActivityId: activityId,
      surveyRecordId: launchingRecord.id,
      sectionSpan: launchingRecord.spanName,
      chainage: launchingRecord.chainageStart && launchingRecord.chainageEnd 
        ? `${launchingRecord.chainageStart} - ${launchingRecord.chainageEnd}` 
        : undefined,
      surveyData: {
        peggingNotes: launchingRecord.peggingNotes,
        coordinates: launchingRecord.coordinates,
        benchMarkRef: launchingRecord.benchmarkRef,
        surveyorName: (launchingRecord.surveyors || []).join(', '),
        surveyDate: launchingRecord.surveyDate,
        elevation: launchingRecord.elevation
      }
    };

    const defaultSubtasks: SubTask[] = [
      surveySubtask,
      {
        id: `ST-MARK-${Date.now().toString(36)}`,
        title: 'Trench marking & alignment checks',
        category: 'Excavation & Earthworks',
        status: 'Not Started',
        targetQuantity: launchingRecord.distanceMeters,
        completedQuantity: 0,
        unit: 'm'
      },
      {
        id: `ST-EXC-${Date.now().toString(36)}`,
        title: 'Trench excavation to invert grade',
        category: 'Excavation & Earthworks',
        status: 'Not Started',
        targetQuantity: Math.round(launchingRecord.distanceMeters * 1.2),
        completedQuantity: 0,
        unit: 'm³'
      },
      {
        id: `ST-BED-${Date.now().toString(36)}`,
        title: 'Sand bedding layer (100mm)',
        category: 'Excavation & Earthworks',
        status: 'Not Started',
        targetQuantity: Math.round(launchingRecord.distanceMeters * 0.4),
        completedQuantity: 0,
        unit: 'm³'
      },
      {
        id: `ST-PIPE-${Date.now().toString(36)}`,
        title: 'Pipe laying, laser joint alignment & testing',
        category: 'Cable & Underground Installation',
        status: 'Not Started',
        targetQuantity: launchingRecord.distanceMeters,
        completedQuantity: 0,
        unit: 'm',
        isMilestone: true,
        milestoneCriteria: 'Joint welding/coupling pressure integrity QA sign-off'
      }
    ];

    const initialProgress = Math.round((1 / defaultSubtasks.length) * 100);

    const newAct: Activity = {
      id: activityId,
      projectId: launchingRecord.projectId || projects[0]?.id || 'PRJ-001',
      name: newActivityName,
      description: `Linear construction package along corridor section ${launchingRecord.spanName} (${launchingRecord.chainageStart || ''} to ${launchingRecord.chainageEnd || ''}). Total distance: ${launchingRecord.distanceMeters}m.`,
      workPackage: launchWorkPackage,
      area: launchingRecord.spanName,
      location: launchingRecord.spanName,
      chainage: launchingRecord.chainageStart && launchingRecord.chainageEnd 
        ? `${launchingRecord.chainageStart} - ${launchingRecord.chainageEnd}` 
        : undefined,
      priority: 'Medium',
      discipline: 'Civil & Earthworks',
      targetQuantity: launchingRecord.distanceMeters,
      actualQuantity: 0,
      unit: 'm',
      status: 'In Progress',
      progress: initialProgress,
      startDate: launchStartDate,
      finishDate: launchEndDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      endDate: launchEndDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      assignedTo: launchingRecord.surveyors?.[0] || 'Civil Construction Team',
      supervisor: 'Site Supervisor',
      plannedHours: 80,
      actualHours: 8,
      subtasks: defaultSubtasks,
      assignedLabour: (launchingRecord.surveyors || []).map((s, idx) => ({
        id: `TLA-SURV-${Date.now()}-${idx}`,
        name: s,
        role: 'Surveyor / Operator',
        hours: 8,
        startDate: launchStartDate
      })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    addActivity(newAct);

    // Link the survey record to this newly launched activity
    updateSurveyRecord({
      ...launchingRecord,
      linkedActivityId: newAct.id,
      linkedActivityName: newAct.name,
      linkedSubtaskId: surveySubtask.id,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setLaunchingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Master Corridor Analytics */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 dark:from-slate-900/90 dark:via-indigo-950/20 dark:to-slate-900/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Survey & Advance Work Hub</h2>
                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 font-bold">
                  By-Link Corridor System
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track ground benchmarks, trench set-outs, and linear pegging across all sections (e.g. PTS 1 - PTS 20). Link directly to construction activities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button 
              variant="outline"
              onClick={() => setIsBatchModalOpen(true)}
              className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-semibold h-9 rounded-xl flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Batch Generate Sections
            </Button>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Survey Section
            </Button>
          </div>
        </div>

        {/* Master Corridor Progress Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-5">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Total Linear Corridor Set-Out
              </span>
              <span className="font-black text-indigo-700 dark:text-indigo-300 text-sm font-mono">
                {totalCompletedMeters.toLocaleString()} m / {totalCorridorMeters.toLocaleString()} m ({corridorProgressPct}%)
              </span>
            </div>
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-indigo-100 dark:border-indigo-950">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${corridorProgressPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Remaining Corridor: {(totalCorridorMeters - totalCompletedMeters).toLocaleString()} m</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{advanceReadyCount} sections ready for earthworks</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Set-Outs</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{completedSectionsCount}</span>
                <span className="text-xs text-slate-400">/ {surveyRecords.length} spans</span>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Linked to Civil Activities</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{linkedSectionsCount}</span>
                <span className="text-xs text-slate-400">active sections</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search span (e.g. PTS 1, Dimi, CH 0+433)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold gap-1">
            {['All', 'Completed', 'In Progress', 'Not Started'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterStatus === st 
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold gap-1">
            {(['All', 'Linked', 'Unlinked'] as const).map(lk => (
              <button
                key={lk}
                onClick={() => setFilterLink(lk)}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  filterLink === lk 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {lk === 'All' ? 'All Links' : lk === 'Linked' ? '🔗 Linked' : '🟢 Advance (Unlinked)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Survey Sections Grid */}
      {filteredRecords.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 mx-auto flex items-center justify-center mb-3">
            <Compass className="h-6 w-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Survey Sections Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Create single linear spans or batch generate PTS 1 to PTS 20 in 1 click.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setIsBatchModalOpen(true)} className="bg-indigo-600 text-white text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Batch Generate PTS 1 to PTS 20
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRecords.map(record => {
            const isCompleted = record.status === 'Completed';
            const isInProgress = record.status === 'In Progress';
            const isLinked = !!record.linkedActivityId;
            const pct = record.distanceMeters > 0 
              ? Math.round((record.completedMeters / record.distanceMeters) * 100) 
              : (isCompleted ? 100 : 0);

            return (
              <Card 
                key={record.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 hover:shadow-md ${
                  isCompleted 
                    ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/10' 
                    : isInProgress
                    ? 'border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-b from-white to-amber-50/20 dark:from-slate-900 dark:to-amber-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Span & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <Flag className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                          {record.spanName}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {record.chainageStart || 'CH 0+000'} ➔ {record.chainageEnd || `+${record.distanceMeters}m`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleComplete(record)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                        isCompleted 
                          ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600' 
                          : isInProgress 
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                      title="Click to toggle completion"
                    >
                      {isCompleted ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {record.status}
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Set-Out Distance</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{record.completedMeters} / {record.distanceMeters} m ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>

                  {/* Survey Crew & Pegging info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Users className="h-3 w-3 text-indigo-500" /> Crew:
                      </span>
                      <span className="font-semibold truncate max-w-[180px]">
                        {(record.surveyors && record.surveyors.length > 0) ? record.surveyors.join(', ') : 'Unassigned'}
                      </span>
                    </div>

                    {record.benchmarkRef && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Benchmark / Elevation:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {record.benchmarkRef} {record.elevation ? `(${record.elevation})` : ''}
                        </span>
                      </div>
                    )}

                    {record.surveyDate && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Survey Date:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{record.surveyDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Link & Launch Action */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {isLinked ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <Link2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                          {record.linkedActivityName || record.linkedActivityId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenActivity && record.linkedActivityId && (
                          <button
                            onClick={() => onOpenActivity(record.linkedActivityId!)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                            title="Open Construction Activity"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => unlinkSurveyRecordFromActivity(record.id)}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Unlink activity"
                        >
                          <Unlink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      {isCompleted ? (
                        <Button
                          onClick={() => {
                            setLaunchingRecord(record);
                            setLaunchActivityName(`${record.spanName} Trench Excavation & Pipe Laying`);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Launch Construction Activity
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setLinkingRecordId(record.id);
                            setSelectedActivityToLink(activities[0]?.id || '');
                          }}
                          className="w-full text-slate-600 dark:text-slate-300 text-xs font-medium h-8 rounded-xl flex items-center justify-center gap-1"
                        >
                          <Link2 className="h-3 w-3" /> Link to Activity
                        </Button>
                      )}

                      <button
                        onClick={() => setEditingRecord(record)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit survey record"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete survey section "${record.spanName}"?`)) {
                            deleteSurveyRecord(record.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal 1: Add Single Survey Section */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="h-5 w-5 text-indigo-600" /> Add Linear Survey Section
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Span Name / Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PTS 20 - PTS 21" 
                    value={spanName} 
                    onChange={e => setSpanName(e.target.value)} 
                    required 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Distance (Meters)</label>
                  <input 
                    type="number" 
                    placeholder="433" 
                    value={distanceMeters} 
                    onChange={e => {
                      const d = Number(e.target.value);
                      setDistanceMeters(d);
                      if (status === 'Completed') setCompletedMeters(d);
                    }} 
                    required 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Start Chainage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CH 0+000" 
                    value={chainageStart} 
                    onChange={e => setChainageStart(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">End Chainage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CH 0+433" 
                    value={chainageEnd} 
                    onChange={e => setChainageEnd(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Survey Status</label>
                  <select 
                    value={status} 
                    onChange={e => {
                      const st = e.target.value as SurveySectionRecord['status'];
                      setStatus(st);
                      if (st === 'Completed') setCompletedMeters(distanceMeters);
                      else if (st === 'Not Started') setCompletedMeters(0);
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  >
                    <option value="Completed">Completed (100%)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Not Started">Not Started</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Survey Date</label>
                  <input 
                    type="date" 
                    value={surveyDate} 
                    onChange={e => setSurveyDate(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Benchmark Reference</label>
                  <input 
                    type="text" 
                    placeholder="e.g. BM-PTS-20" 
                    value={benchmarkRef} 
                    onChange={e => setBenchmarkRef(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Elevation</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1422m AMSL" 
                    value={elevation} 
                    onChange={e => setElevation(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Pegging & Benchmark Notes</label>
                <textarea 
                  rows={2} 
                  value={peggingNotes} 
                  onChange={e => setPeggingNotes(e.target.value)} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Survey Section</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Generate Linear Corridor (PTS 1 to PTS 20) */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" /> Batch Corridor Generator
              </h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Quickly populate continuous pipeline or road sections (e.g. PTS 1 to PTS 20) with automated chainages and default segment lengths.
            </p>

            <form onSubmit={handleBatchGenerate} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Prefix</label>
                  <input 
                    type="text" 
                    value={batchPrefix} 
                    onChange={e => setBatchPrefix(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold text-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Start Peg #</label>
                  <input 
                    type="number" 
                    value={batchStartNum} 
                    onChange={e => setBatchStartNum(Number(e.target.value))} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">End Peg #</label>
                  <input 
                    type="number" 
                    value={batchEndNum} 
                    onChange={e => setBatchEndNum(Number(e.target.value))} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Default Section Length (Meters)</label>
                <input 
                  type="number" 
                  value={batchDefaultDist} 
                  onChange={e => setBatchDefaultDist(Number(e.target.value))} 
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200 font-medium">
                Will generate <strong>{Math.max(0, batchEndNum - batchStartNum)} sections</strong> from <strong>{batchPrefix} {batchStartNum} - {batchPrefix} {batchStartNum + 1}</strong> through <strong>{batchPrefix} {batchEndNum - 1} - {batchPrefix} {batchEndNum}</strong> (Total: {((batchEndNum - batchStartNum) * batchDefaultDist).toLocaleString()} meters).
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsBatchModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Generate Corridor Spans</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Launch Construction Activity from Survey Record */}
      {launchingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Launch Construction Activity ({launchingRecord.spanName})
              </h3>
              <button onClick={() => setLaunchingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              This will create a new earthworks & pipe laying activity for this section. The <strong>Trench set-out</strong> subtask will automatically be linked and pre-marked as 100% completed with the surveyor's data.
            </p>

            <form onSubmit={handleLaunchActivityFromSurvey} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Activity Title</label>
                <input 
                  type="text" 
                  value={launchActivityName} 
                  onChange={e => setLaunchActivityName(e.target.value)} 
                  required 
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Work Package</label>
                  <input 
                    type="text" 
                    value={launchWorkPackage} 
                    onChange={e => setLaunchWorkPackage(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Section Length</label>
                  <div className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center font-bold text-indigo-600">
                    {launchingRecord.distanceMeters} meters
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Civil Start Date</label>
                  <input 
                    type="date" 
                    value={launchStartDate} 
                    onChange={e => setLaunchStartDate(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Target End Date</label>
                  <input 
                    type="date" 
                    value={launchEndDate} 
                    onChange={e => setLaunchEndDate(e.target.value)} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Pre-linked WBS Milestone:
                </div>
                <div>
                  • <strong>Trench set-out ({launchingRecord.spanName})</strong>: {launchingRecord.distanceMeters}m completed by {(launchingRecord.surveyors || []).join(', ') || 'Survey Team'} on {launchingRecord.surveyDate || 'today'}.
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setLaunchingRecord(null)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Launch Activity & Bind Survey
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Link to Existing Activity */}
      {linkingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-600" /> Link Survey to Construction Activity
              </h3>
              <button onClick={() => setLinkingRecordId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-600 dark:text-slate-300 font-semibold block">Select Target Activity</label>
              <select
                value={selectedActivityToLink}
                onChange={e => setSelectedActivityToLink(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-medium"
              >
                <option value="">-- Choose an active construction activity --</option>
                {activities.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.area || act.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setLinkingRecordId(null)}>Cancel</Button>
              <Button onClick={handleLinkSubmit} disabled={!selectedActivityToLink} className="bg-indigo-600 text-white">
                Bind Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Edit Survey Record */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-600" /> Edit Survey Section ({editingRecord.spanName})
              </h3>
              <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Span Name</label>
                  <input 
                    type="text" 
                    value={editingRecord.spanName} 
                    onChange={e => setEditingRecord({ ...editingRecord, spanName: e.target.value })} 
                    required 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Distance (Meters)</label>
                  <input 
                    type="number" 
                    value={editingRecord.distanceMeters} 
                    onChange={e => setEditingRecord({ ...editingRecord, distanceMeters: Number(e.target.value) })} 
                    required 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Status</label>
                  <select 
                    value={editingRecord.status} 
                    onChange={e => {
                      const st = e.target.value as SurveySectionRecord['status'];
                      setEditingRecord({ 
                        ...editingRecord, 
                        status: st,
                        completedMeters: st === 'Completed' ? editingRecord.distanceMeters : editingRecord.completedMeters 
                      });
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Not Started">Not Started</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Completed Meters</label>
                  <input 
                    type="number" 
                    value={editingRecord.completedMeters} 
                    onChange={e => setEditingRecord({ ...editingRecord, completedMeters: Number(e.target.value) })} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Start Chainage</label>
                  <input 
                    type="text" 
                    value={editingRecord.chainageStart || ''} 
                    onChange={e => setEditingRecord({ ...editingRecord, chainageStart: e.target.value })} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">End Chainage</label>
                  <input 
                    type="text" 
                    value={editingRecord.chainageEnd || ''} 
                    onChange={e => setEditingRecord({ ...editingRecord, chainageEnd: e.target.value })} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Benchmark Ref</label>
                  <input 
                    type="text" 
                    value={editingRecord.benchmarkRef || ''} 
                    onChange={e => setEditingRecord({ ...editingRecord, benchmarkRef: e.target.value })} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Survey Date</label>
                  <input 
                    type="date" 
                    value={editingRecord.surveyDate || ''} 
                    onChange={e => setEditingRecord({ ...editingRecord, surveyDate: e.target.value })} 
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-300 font-semibold block mb-1">Pegging & Benchmark Notes</label>
                <textarea 
                  rows={2} 
                  value={editingRecord.peggingNotes || ''} 
                  onChange={e => setEditingRecord({ ...editingRecord, peggingNotes: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
