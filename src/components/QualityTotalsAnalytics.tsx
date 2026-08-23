import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Ruler, 
  Scale, 
  Percent, 
  Layers, 
  TrendingUp, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Calendar, 
  Clock, 
  ArrowUpRight, 
  Download, 
  Printer, 
  ChevronRight, 
  Sliders, 
  Check, 
  AlertTriangle,
  Send,
  UserCheck,
  CheckSquare,
  BarChart3,
  Sparkles,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { QAInspectionItem, QARFIItem, QARFIStatus, QARFIType } from '../types';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Badge, CustomSelect } from './ui';
import { QAMeasurementModal } from './QAMeasurementModal';
import { NewRFIModal } from './NewRFIModal';

interface QualityTotalsAnalyticsProps {
  onSelectInspection?: (inspection: QAInspectionItem) => void;
  onBackToInspections?: () => void;
}

export function QualityTotalsAnalytics({ onSelectInspection, onBackToInspections }: QualityTotalsAnalyticsProps) {
  const { 
    qaInspections, 
    rfis, 
    projects, 
    activities, 
    updateQAInspection, 
    addQAInspection, 
    updateRFI, 
    deleteRFI,
    userRole, 
    hasPermission 
  } = useAppContext();

  const canEditQuality = hasPermission('quality');

  const [activeSubTab, setActiveSubTab] = useState<'overalls' | 'rfis' | 'disciplines'>('overalls');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('All');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [rfiSearchQuery, setRfiSearchQuery] = useState<string>('');
  const [rfiStatusFilter, setRfiStatusFilter] = useState<string>('All');
  const [rfiTypeFilter, setRfiTypeFilter] = useState<string>('All');

  // Modals
  const [isNewRFIModalOpen, setIsNewRFIModalOpen] = useState(false);
  const [editingRFI, setEditingRFI] = useState<QARFIItem | null>(null);
  const [measuringInspection, setMeasuringInspection] = useState<QAInspectionItem | null>(null);

  // Filtered Inspections and RFIs
  const filteredInspections = useMemo(() => {
    return qaInspections.filter(i => {
      if (selectedProjectId !== 'All' && i.projectId !== selectedProjectId) return false;
      if (selectedDiscipline !== 'All' && i.category !== selectedDiscipline) return false;
      return true;
    });
  }, [qaInspections, selectedProjectId, selectedDiscipline]);

  const filteredRFIs = useMemo(() => {
    return (rfis || []).filter(r => {
      if (selectedProjectId !== 'All' && r.projectId !== selectedProjectId) return false;
      if (selectedDiscipline !== 'All' && r.discipline !== selectedDiscipline) return false;
      if (rfiStatusFilter !== 'All' && r.status !== rfiStatusFilter) return false;
      if (rfiTypeFilter !== 'All' && r.rfiType !== rfiTypeFilter) return false;
      if (rfiSearchQuery.trim()) {
        const q = rfiSearchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) ||
          r.rfiNumber.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rfis, selectedProjectId, selectedDiscipline, rfiStatusFilter, rfiTypeFilter, rfiSearchQuery]);

  // Comprehensive Aggregations & Calculations
  const stats = useMemo(() => {
    const totalInspections = filteredInspections.length;
    const passedInspections = filteredInspections.filter(i => i.status === 'Passed').length;
    const failedInspections = filteredInspections.filter(i => i.status === 'Failed').length;
    const pendingInspections = filteredInspections.filter(i => i.status === 'Pending Approval').length;
    const inspectionPassRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;

    const totalRFIs = filteredRFIs.length;
    const approvedRFIs = filteredRFIs.filter(r => r.status === 'Approved' || r.status === 'Approved with Comments').length;
    const underReviewRFIs = filteredRFIs.filter(r => r.status === 'Under Review' || r.status === 'Submitted').length;
    const rejectedRFIs = filteredRFIs.filter(r => r.status === 'Rejected / Revise').length;
    const rfiResolutionRate = totalRFIs > 0 ? Math.round((approvedRFIs / totalRFIs) * 100) : 0;

    // Measurement Totals by Unit & Type
    const measurementBreakdown: Record<string, { unit: string; target: number; inspected: number; approved: number; rejected: number }> = {};

    filteredInspections.forEach(i => {
      const type = i.measurementType || 'Length';
      const unit = i.unit || 'm';
      const key = `${type} (${unit})`;

      if (!measurementBreakdown[key]) {
        measurementBreakdown[key] = { unit, target: 0, inspected: 0, approved: 0, rejected: 0 };
      }
      measurementBreakdown[key].target += i.targetQuantity || 0;
      measurementBreakdown[key].inspected += i.inspectedQuantity || 0;
      measurementBreakdown[key].approved += i.approvedQuantity || 0;
      measurementBreakdown[key].rejected += i.rejectedQuantity || 0;
    });

    // Discipline breakdown
    const disciplineStats: Record<string, { 
      discipline: string; 
      inspectionsCount: number; 
      passedCount: number; 
      failedCount: number;
      targetScope: number; 
      approvedScope: number; 
      unit: string;
      rfisCount: number;
    }> = {};

    filteredInspections.forEach(i => {
      const disc = i.category || 'General';
      if (!disciplineStats[disc]) {
        disciplineStats[disc] = {
          discipline: disc,
          inspectionsCount: 0,
          passedCount: 0,
          failedCount: 0,
          targetScope: 0,
          approvedScope: 0,
          unit: i.unit || 'm',
          rfisCount: 0
        };
      }
      disciplineStats[disc].inspectionsCount += 1;
      if (i.status === 'Passed') disciplineStats[disc].passedCount += 1;
      if (i.status === 'Failed') disciplineStats[disc].failedCount += 1;
      disciplineStats[disc].targetScope += i.targetQuantity || 0;
      disciplineStats[disc].approvedScope += i.approvedQuantity || 0;
    });

    (rfis || []).forEach(r => {
      const disc = r.discipline || 'General';
      if (disciplineStats[disc]) {
        disciplineStats[disc].rfisCount += 1;
      }
    });

    // Overall Quality Index
    const overallScore = totalInspections + totalRFIs > 0 
      ? Math.round(((passedInspections + approvedRFIs) / (totalInspections + totalRFIs)) * 100) 
      : 100;

    return {
      totalInspections,
      passedInspections,
      failedInspections,
      pendingInspections,
      inspectionPassRate,
      totalRFIs,
      approvedRFIs,
      underReviewRFIs,
      rejectedRFIs,
      rfiResolutionRate,
      measurementBreakdown,
      disciplineStats: Object.values(disciplineStats),
      overallScore
    };
  }, [filteredInspections, filteredRFIs, rfis]);

  // Convert RFI to Passed QA Inspection
  const handleConvertRFIToInspection = (rfi: QARFIItem) => {
    const newInspection: QAInspectionItem = {
      id: `QA-${Math.floor(200 + Math.random() * 800)}`,
      projectId: rfi.projectId,
      activityId: rfi.activityId,
      title: rfi.title,
      category: rfi.discipline,
      location: rfi.location,
      inspector: rfi.assignedReviewer || 'QA Inspector',
      date: new Date().toISOString().split('T')[0],
      inspectionTime: new Date().toTimeString().substring(0, 5),
      submissionDate: rfi.dateSubmitted || new Date().toISOString().split('T')[0],
      documentNumber: rfi.rfiNumber,
      epc: 'Scedih Engineering (EPC)',
      subcontractor: rfi.requestedBy,
      status: 'Passed',
      measurementType: rfi.measurementType || 'Length',
      unit: rfi.unit || 'm',
      targetQuantity: rfi.quantity || 100,
      inspectedQuantity: rfi.quantity || 100,
      approvedQuantity: rfi.quantity || 100,
      rejectedQuantity: 0,
      toleranceSpec: rfi.toleranceSpec,
      signoffNotes: `Generated from approved Work Inspection Request ${rfi.rfiNumber}.`,
      approvedBy: rfi.assignedReviewer || 'QA Lead',
      approvalDate: new Date().toISOString().split('T')[0]
    };

    addQAInspection(newInspection);
    updateRFI({
      ...rfi,
      status: 'Approved',
      dateClosed: new Date().toISOString().split('T')[0],
      linkedQAInspectionId: newInspection.id
    });
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-6 overflow-y-auto">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                QA/QC & RFI Overalls & Executive Totals
              </h1>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40">
                Live Register
              </Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              Comprehensive physical measurement totals, Work Inspection Requests (RFI/WIR), clearance health, and discipline breakdown.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {onBackToInspections && (
            <Button
              variant="outline"
              onClick={onBackToInspections}
              className="rounded-xl h-10 px-3.5 text-xs font-bold gap-1.5"
            >
              <FileText className="h-4 w-4" /> Inspections List
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handlePrintSummary}
            className="rounded-xl h-10 px-3 text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Export / Print
          </Button>

          {canEditQuality && (
            <Button
              onClick={() => setIsNewRFIModalOpen(true)}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl h-10 px-4 text-xs font-bold gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Raise RFI / WIR
            </Button>
          )}
        </div>
      </div>

      {/* Global Filter Toolbar & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-100 dark:bg-slate-850 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Sub-tab pills */}
        <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'overalls', label: 'Overalls & Totals', icon: BarChart3 },
            { id: 'rfis', label: `RFI & WIR Register (${filteredRFIs.length})`, icon: Send },
            { id: 'disciplines', label: 'Discipline Matrix', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`h-8 rounded-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none px-3 font-bold ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Project & Discipline Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold hidden md:inline">Project:</span>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
            >
              <option value="All">All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold hidden md:inline">Discipline:</span>
            <select
              value={selectedDiscipline}
              onChange={e => setSelectedDiscipline(e.target.value)}
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none"
            >
              <option value="All">All Disciplines</option>
              {['Earthworks', 'Concrete', 'Structural Steel', 'Civil Utilities', 'MEP Clearance', 'Survey & Setting Out'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: OVERALLS & EXECUTIVE TOTALS DASHBOARD */}
      {/* ==================================================================== */}
      {activeSubTab === 'overalls' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Executive KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Inspections Card */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inspections</span>
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                  {stats.totalInspections}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                  <span className="text-emerald-600 font-bold">{stats.passedInspections} Passed ({stats.inspectionPassRate}%)</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600">{stats.failedInspections} NCRs</span>
                </div>
              </div>
            </Card>

            {/* Total Work Inspection Requests (RFIs) */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total RFI / WIRs</span>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF]">
                  <Send className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                  {stats.totalRFIs}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold mt-1">
                  <span className="text-emerald-600 font-bold">{stats.approvedRFIs} Cleared</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-blue-600">{stats.underReviewRFIs} Under Review</span>
                </div>
              </div>
            </Card>

            {/* Quality Compliance Index */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quality Compliance Index</span>
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {stats.overallScore}%
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1">
                  Combined inspection & RFI clearance rate
                </div>
              </div>
            </Card>

            {/* Active Defect / Non-Conformance Rate */}
            <Card className="p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Defect / NCR Rate</span>
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black font-mono text-rose-600">
                  {stats.totalInspections > 0 ? Math.round((stats.failedInspections / stats.totalInspections) * 100) : 0}%
                </div>
                <div className="text-xs text-rose-500 font-medium mt-1">
                  {stats.failedInspections} active NCRs requiring remediation
                </div>
              </div>
            </Card>

          </div>

          {/* Physical Measurement Totals by Engineering Unit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Ruler className="h-4 w-4 text-emerald-600" />
                Cumulative Physical Quantities & Measurements Cleared
              </h3>
              <span className="text-xs text-slate-400">
                Aggregated from site level measurements & test points
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.measurementBreakdown).map(([label, m]) => {
                const passRate = m.inspected > 0 ? Math.round((m.approved / m.inspected) * 100) : 0;
                const scopeRate = m.target > 0 ? Math.round((m.inspected / m.target) * 100) : 0;

                return (
                  <Card key={label} className="p-4 border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-bold text-xs">
                          {label}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono font-bold">
                        {passRate}% Cleared
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Total Target</span>
                        <strong className="font-mono text-slate-800 dark:text-slate-200">{m.target.toLocaleString()} {m.unit}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-500 block font-semibold">Inspected</span>
                        <strong className="font-mono text-[#0B5FFF]">{m.inspected.toLocaleString()} {m.unit}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-500 block font-semibold">Approved</span>
                        <strong className="font-mono text-emerald-600">{m.approved.toLocaleString()} {m.unit}</strong>
                      </div>
                    </div>

                    {/* Progress visualizer */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${m.target > 0 ? (m.approved / m.target) * 100 : passRate}%` }}
                          title={`Approved: ${m.approved} ${m.unit}`}
                        />
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${m.target > 0 ? (m.rejected / m.target) * 100 : 0}%` }}
                          title={`Rejected: ${m.rejected} ${m.unit}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{scopeRate}% of target inspected</span>
                        {m.rejected > 0 && <span className="text-rose-500">{m.rejected} {m.unit} defective</span>}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {Object.keys(stats.measurementBreakdown).length === 0 && (
                <div className="col-span-full p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No measurement data recorded yet. Use the "Measure / Quantities" button on any inspection to log physical scope.
                </div>
              )}
            </div>
          </div>

          {/* Quick RFI Action Strip */}
          <Card className="p-5 border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0B5FFF] text-white">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Work Inspection Requests (WIR / RFI) Requiring Action ({filteredRFIs.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pending QA inspection sign-offs and consultant technical approvals.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveSubTab('rfis')}
                className="bg-[#0B5FFF] text-white text-xs font-bold rounded-xl gap-1"
              >
                Open Full RFI Register <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {filteredRFIs.slice(0, 2).map(rfi => (
                <div 
                  key={rfi.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#0B5FFF]">{rfi.rfiNumber}</span>
                      <Badge variant="outline" className="text-[10px]">{rfi.discipline}</Badge>
                      <Badge variant={rfi.priority === 'Critical' ? 'danger' : rfi.priority === 'High' ? 'warning' : 'outline'} className="text-[10px]">
                        {rfi.priority}
                      </Badge>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-1">{rfi.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{rfi.location} • Target: {rfi.targetResponseDate}</div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {rfi.status !== 'Approved' && canEditQuality && (
                      <Button
                        size="sm"
                        onClick={() => handleConvertRFIToInspection(rfi)}
                        className="h-8 px-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                      >
                        <Check className="h-3 w-3" /> Approve & Sign Off
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: RFI & WORK INSPECTION REQUEST REGISTER */}
      {/* ==================================================================== */}
      {activeSubTab === 'rfis' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search RFI number, title, location, requested by..."
                value={rfiSearchQuery}
                onChange={e => setRfiSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:border-[#0B5FFF]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={rfiTypeFilter}
                onChange={e => setRfiTypeFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                <option value="All">All RFI Types</option>
                <option value="Request For Inspection (WIR)">Work Inspection Request (WIR)</option>
                <option value="Hold Point Clearance">Hold Point Clearance</option>
                <option value="Request For Information (Technical Query)">Technical Query (RFI)</option>
                <option value="Material Approval Request">Material Approval</option>
              </select>

              <select
                value={rfiStatusFilter}
                onChange={e => setRfiStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected / Revise">Rejected / Revise</option>
              </select>

              {canEditQuality && (
                <Button
                  onClick={() => setIsNewRFIModalOpen(true)}
                  className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm"
                >
                  <Plus className="h-4 w-4" /> New RFI / WIR
                </Button>
              )}
            </div>
          </div>

          {/* RFI Cards List */}
          <div className="space-y-3">
            {filteredRFIs.map(rfi => {
              const isApproved = rfi.status === 'Approved' || rfi.status === 'Approved with Comments';
              const isRejected = rfi.status === 'Rejected / Revise';
              const isUnderReview = rfi.status === 'Under Review' || rfi.status === 'Submitted';

              return (
                <Card 
                  key={rfi.id}
                  className="p-5 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-[#0B5FFF]">{rfi.rfiNumber}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold">{rfi.rfiType}</Badge>
                      <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {rfi.discipline}
                      </Badge>
                      <Badge 
                        variant={rfi.priority === 'Critical' ? 'danger' : rfi.priority === 'High' ? 'warning' : 'outline'}
                        className="text-[10px] font-bold"
                      >
                        {rfi.priority} Priority
                      </Badge>

                      {rfi.quantity ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {rfi.quantity} {rfi.unit || 'm'}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {rfi.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {rfi.description}
                    </p>

                    {rfi.responseClarification && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300">
                        <strong>Reviewer Clarification:</strong> {rfi.responseClarification}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-1">
                      <span>Location: <strong className="text-slate-700 dark:text-slate-300">{rfi.location}</strong></span>
                      <span>Requested by: <strong className="text-slate-700 dark:text-slate-300">{rfi.requestedBy}</strong></span>
                      <span>Reviewer: <strong className="text-slate-700 dark:text-slate-300">{rfi.assignedReviewer}</strong></span>
                      <span>Submitted: <strong className="text-slate-700 dark:text-slate-300">{rfi.dateSubmitted}</strong></span>
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
                    <Badge
                      variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                      className="text-xs font-bold px-3 py-1.5"
                    >
                      {rfi.status}
                    </Badge>

                    {canEditQuality && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRFI(rfi);
                            setIsNewRFIModalOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-bold rounded-xl"
                        >
                          Edit / Respond
                        </Button>

                        {!isApproved && (
                          <Button
                            size="sm"
                            onClick={() => handleConvertRFIToInspection(rfi)}
                            className="h-8 px-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Log Inspection
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              );
            })}

            {filteredRFIs.length === 0 && (
              <Card className="p-8 text-center border-slate-200 dark:border-slate-800">
                <Send className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">No Work Inspection Requests match the active filters.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: DISCIPLINE-BY-DISCIPLINE QUALITY MATRIX */}
      {/* ==================================================================== */}
      {activeSubTab === 'disciplines' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Discipline-by-Discipline Inspection & Clearance Progress Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Cross-discipline performance comparing target scope vs approved quantities and open non-conformances.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 dark:bg-slate-900/60 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Discipline</th>
                    <th className="p-4">Total Inspections</th>
                    <th className="p-4">Passed / NCRs</th>
                    <th className="p-4">Total Scope</th>
                    <th className="p-4">Approved Scope</th>
                    <th className="p-4">Clearance %</th>
                    <th className="p-4">Active RFIs</th>
                    <th className="p-4 text-right">Clearance Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {stats.disciplineStats.map(disc => {
                    const passRate = disc.targetScope > 0 
                      ? Math.round((disc.approvedScope / disc.targetScope) * 100) 
                      : (disc.inspectionsCount > 0 ? Math.round((disc.passedCount / disc.inspectionsCount) * 100) : 0);

                    return (
                      <tr key={disc.discipline} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-4 font-bold text-slate-900 dark:text-white text-sm">
                          {disc.discipline}
                        </td>
                        <td className="p-4 font-mono font-bold">
                          {disc.inspectionsCount} Inspections
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-bold font-mono">✓ {disc.passedCount}</span>
                            {disc.failedCount > 0 && (
                              <span className="text-rose-600 font-bold font-mono">✗ {disc.failedCount}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                          {disc.targetScope.toLocaleString()} {disc.unit}
                        </td>
                        <td className="p-4 font-mono font-bold text-emerald-600">
                          {disc.approvedScope.toLocaleString()} {disc.unit}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                          {passRate}%
                        </td>
                        <td className="p-4 font-mono text-blue-600 font-bold">
                          {disc.rfisCount} RFIs
                        </td>
                        <td className="p-4 text-right">
                          <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ml-auto">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, passRate)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* RFI Modal */}
      {isNewRFIModalOpen && (
        <NewRFIModal
          isOpen={isNewRFIModalOpen}
          initialRFI={editingRFI}
          onClose={() => {
            setIsNewRFIModalOpen(false);
            setEditingRFI(null);
          }}
        />
      )}

      {/* Measurement Modal */}
      {measuringInspection && (
        <QAMeasurementModal
          inspection={measuringInspection}
          isOpen={Boolean(measuringInspection)}
          onClose={() => setMeasuringInspection(null)}
          onSave={(updated) => {
            updateQAInspection(updated);
            setMeasuringInspection(null);
          }}
        />
      )}

    </div>
  );
}

export default QualityTotalsAnalytics;
