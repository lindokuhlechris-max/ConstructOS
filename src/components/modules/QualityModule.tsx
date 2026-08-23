import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../ui';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  X,
  AlertCircle, 
  ArrowLeft, 
  FileText, 
  User, 
  Search, 
  Eye, 
  Filter, 
  FolderOpen, 
  ExternalLink,
  Ruler,
  Scale,
  Percent,
  Layers,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  Clock,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon,
  Copy,
  Printer
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { QAInspectionItem, QAMeasurementType } from '../../types';
import { QualityDetail } from '../QualityDetail';
import { QAMeasurementModal } from '../QAMeasurementModal';
import { QualityTotalsAnalytics } from '../QualityTotalsAnalytics';
import { QAActivityMultiSelectModal } from '../quality/QAActivityMultiSelectModal';
import { MultiDrawingInput } from '../quality/MultiDrawingInput';
import { QAPrintRegisterModal } from '../quality/QAPrintRegisterModal';
import { navigateToPreviousRoute } from '../../lib/navigationHistory';

interface QualityModuleProps {
  onBack: () => void;
}

const MEASUREMENT_PRESETS: { type: QAMeasurementType; unit: string; label: string }[] = [
  { type: 'Length', unit: 'm', label: 'Linear Length (m)' },
  { type: 'Quantity', unit: 'Nos', label: 'Quantity / Count (Nos)' },
  { type: 'Volume', unit: 'm³', label: 'Volume (m³)' },
  { type: 'Area', unit: 'm²', label: 'Surface Area (m²)' },
  { type: 'Weight', unit: 'tonnes', label: 'Weight / Mass (t)' },
  { type: 'Thickness', unit: 'mm', label: 'Thickness / Depth (mm)' },
  { type: 'Strength', unit: 'MPa', label: 'Strength / Compaction (MPa)' },
  { type: 'Percentage', unit: '%', label: 'Extent / Progress (%)' }
];

export function QualityModule({ onBack }: QualityModuleProps) {
  const navigate = useNavigate();
  const { 
    qaInspections, 
    activities, 
    projects, 
    documents,
    employees,
    addQAInspection, 
    updateQAInspection, 
    deleteQAInspection, 
    userRole, 
    hasPermission 
  } = useAppContext();

  const canEditQuality = hasPermission('quality');

  const employeeInspectorOptions = (employees && employees.length > 0)
    ? employees.map(emp => ({
        value: `${emp.firstName} ${emp.lastName}`.trim(),
        label: `${emp.firstName} ${emp.lastName}${emp.position ? ` — ${emp.position}` : ''}${emp.department ? ` (${emp.department})` : ''}`
      }))
    : [
        { value: 'Advocate', label: 'Advocate (QA/QC Inspector)' },
        { value: 'David Smith (QA Engineer)', label: 'David Smith (Lead QA Engineer)' },
        { value: 'Michael Moyo', label: 'Michael Moyo (Civil QC Foreman)' },
        { value: 'Lerato Khumalo', label: 'Lerato Khumalo (QC Inspector)' }
      ];

  const [activeView, setActiveView] = useState<'inspections' | 'analytics'>('inspections');
  const [selectedInspection, setSelectedInspection] = useState<QAInspectionItem | null>(null);
  const [measuringInspection, setMeasuringInspection] = useState<QAInspectionItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Failed' | 'Pending Approval'>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'table'>('list');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [activityId, setActivityId] = useState(activities[0]?.id || '');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>(activities[0]?.id ? [activities[0].id] : []);
  const [isActivitySelectModalOpen, setIsActivitySelectModalOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [inspector, setInspector] = useState('David Smith (QA Engineer)');
  const [category, setCategory] = useState('Earthworks');
  
  // Stakeholder & Engineering Reference States
  const [client, setClient] = useState('');
  const [epc, setEpc] = useState('Scedih Engineering (EPC)');
  const [subcontractor, setSubcontractor] = useState('');
  const [documentNumbers, setDocumentNumbers] = useState<string[]>([`QA-ITR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`]);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectionTime, setInspectionTime] = useState(new Date().toTimeString().substring(0, 5));
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceDrawingNumbers, setReferenceDrawingNumbers] = useState<string[]>([]);

  const [clientQCRepresentative, setClientQCRepresentative] = useState('');
  const [clientQCStatus, setClientQCStatus] = useState<'Approved' | 'Rejected' | 'Pending Client Review'>('Pending Client Review');

  // Measurement form state
  const [measurementType, setMeasurementType] = useState<QAMeasurementType>('Length');
  const [unit, setUnit] = useState('m');
  const [targetQuantity, setTargetQuantity] = useState<string>('150');
  const [inspectedQuantity, setInspectedQuantity] = useState<string>('0');
  const [approvedQuantity, setApprovedQuantity] = useState<string>('0');
  const [rejectedQuantity, setRejectedQuantity] = useState<string>('0');
  const [toleranceSpec, setToleranceSpec] = useState<string>('±10mm / SANS 1200');

  const filteredInspections = qaInspections.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.documentNumber && item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.referenceDrawingNumber && item.referenceDrawingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.client && item.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.epc && item.epc.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.subcontractor && item.subcontractor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // Calculate Overall Quality Scope and Clearance Stats
  const totalTrackedTarget = qaInspections.reduce((acc, curr) => acc + (curr.targetQuantity || 0), 0);
  const totalTrackedApproved = qaInspections.reduce((acc, curr) => acc + (curr.approvedQuantity || 0), 0);
  const overallApprovalRate = totalTrackedTarget > 0 ? Math.round((totalTrackedApproved / totalTrackedTarget) * 100) : 0;

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const tQty = parseFloat(targetQuantity) || 0;
    const iQty = parseFloat(inspectedQuantity) || 0;
    const aQty = parseFloat(approvedQuantity) || 0;
    const rQty = parseFloat(rejectedQuantity) || 0;

    let initialStatus: QAInspectionItem['status'] = 'Pending Approval';
    if (rQty > 0) {
      initialStatus = 'Failed';
    } else if (aQty > 0 && (tQty === 0 || aQty >= tQty)) {
      initialStatus = 'Passed';
    }

    const newItem: QAInspectionItem = {
      id: `QA-${Math.floor(200 + Math.random() * 800)}`,
      projectId: projectId || projects[0]?.id || '',
      activityId: selectedActivityIds[0] || activityId || undefined,
      linkedActivityId: selectedActivityIds[0] || activityId || undefined,
      linkedActivityIds: selectedActivityIds.length > 0 ? selectedActivityIds : (activityId ? [activityId] : []),
      title,
      location: location || 'Site Wide',
      inspector: inspector || 'QA Inspector',
      date: inspectionDate || new Date().toISOString().split('T')[0],
      inspectionTime: inspectionTime || new Date().toTimeString().substring(0, 5),
      submissionDate: submissionDate || inspectionDate || new Date().toISOString().split('T')[0],
      status: initialStatus,
      category: category || 'Earthworks',
      
      // Stakeholder & Contractual Metadata
      client: client.trim() || undefined,
      epc: epc.trim() || undefined,
      subcontractor: subcontractor.trim() || undefined,
      documentNumber: documentNumbers.join(', ') || undefined,
      documentNumbers: documentNumbers.length > 0 ? documentNumbers : undefined,
      referenceDrawingNumber: referenceDrawingNumbers.join(', ') || undefined,
      referenceDrawingNumbers: referenceDrawingNumbers.length > 0 ? referenceDrawingNumbers : undefined,

      clientQCRepresentative,
      clientQCStatus,
      clientQCSignoffDate: new Date().toISOString().split('T')[0],
      linkedDocumentIds: [],
      // Measurement & Quality Scope
      measurementType,
      unit: unit || 'm',
      targetQuantity: tQty,
      inspectedQuantity: iQty,
      approvedQuantity: aQty,
      rejectedQuantity: rQty,
      toleranceSpec,
      ncrCode: rQty > 0 ? `NCR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}` : undefined,
      ncrDetails: rQty > 0 ? {
        ncrNumber: `NCR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        deficiencySummary: `Defect noted during inspection: ${rQty} ${unit} rejected out of ${iQty} ${unit} inspected.`,
        status: 'Open'
      } : undefined
    };

    addQAInspection(newItem);
    setIsAdding(false);
    setTitle('');
    setLocation('');
    setClient('');
    setSubcontractor('');
    setDocumentNumbers([`QA-ITR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`]);
    setReferenceDrawingNumbers([]);
    setClientQCRepresentative('');
    setSelectedActivityIds(activities[0]?.id ? [activities[0].id] : []);
    setTargetQuantity('100');
    setInspectedQuantity('0');
    setApprovedQuantity('0');
    setRejectedQuantity('0');
  };

  const handleStatusChange = (id: string, newStatus: QAInspectionItem['status']) => {
    const target = qaInspections.find(i => i.id === id);
    if (!target) return;

    const updated: QAInspectionItem = {
      ...target,
      status: newStatus,
      // If approved directly, set approvedQuantity = inspected or target
      approvedQuantity: newStatus === 'Passed' ? (target.inspectedQuantity || target.targetQuantity || 1) : target.approvedQuantity,
      rejectedQuantity: newStatus === 'Passed' ? 0 : target.rejectedQuantity,
      ncrCode: newStatus === 'Failed' ? (target.ncrCode || `NCR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`) : target.ncrCode,
      ncrDetails: newStatus === 'Failed' ? (target.ncrDetails || {
        ncrNumber: `NCR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        deficiencySummary: 'Quality specification non-conformance identified during inspection.',
        status: 'Open'
      }) : target.ncrDetails
    };

    updateQAInspection(updated);
  };

  const handleCopyInspection = (item: QAInspectionItem) => {
    const incrementDocNumber = (num: string) => {
      const match = num.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const digits = match[2];
        const nextVal = String(parseInt(digits, 10) + 1).padStart(digits.length, '0');
        return `${prefix}${nextVal}`;
      }
      return `${num}-02`;
    };

    const rawDocNums = (item.documentNumbers && item.documentNumbers.length > 0)
      ? item.documentNumbers
      : (item.documentNumber ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);
    
    const newDocNums = rawDocNums.length > 0
      ? rawDocNums.map(incrementDocNumber)
      : [`QA-ITR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`];

    const rawDwgNums = (item.referenceDrawingNumbers && item.referenceDrawingNumbers.length > 0)
      ? item.referenceDrawingNumbers
      : (item.referenceDrawingNumber ? item.referenceDrawingNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) : []);

    setTitle(item.title ? `${item.title} (Copy)` : '');
    setCategory(item.category || 'Earthworks');
    setLocation(item.location || '');
    setInspector(item.inspector || 'David Smith (QA Engineer)');
    setClient(item.client || '');
    setEpc(item.epc || 'Scedih Engineering (EPC)');
    setSubcontractor(item.subcontractor || '');
    setDocumentNumbers(newDocNums);
    setReferenceDrawingNumbers(rawDwgNums);
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setInspectionTime(new Date().toTimeString().substring(0, 5));
    setSubmissionDate(new Date().toISOString().split('T')[0]);
    setClientQCRepresentative(item.clientQCRepresentative || '');
    setClientQCStatus('Pending Client Review');
    setSelectedActivityIds(item.linkedActivityIds || (item.activityId ? [item.activityId] : []));
    setMeasurementType(item.measurementType || 'Length');
    setUnit(item.unit || 'm');
    setTargetQuantity(String(item.targetQuantity || '100'));
    setInspectedQuantity('0');
    setApprovedQuantity('0');
    setRejectedQuantity('0');
    setToleranceSpec(item.toleranceSpec || '±10mm / SANS 1200');

    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (selectedInspection) {
    return (
      <QualityDetail
        inspection={selectedInspection}
        onSave={canEditQuality ? (updated, oldId) => {
          updateQAInspection(updated, oldId);
          setSelectedInspection(updated);
        } : undefined}
        onClose={() => setSelectedInspection(null)}
        onDelete={canEditQuality ? (id) => {
          deleteQAInspection(id);
          setSelectedInspection(null);
        } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full min-h-full p-4 md:p-6 pb-32 md:pb-40 overflow-y-auto overflow-x-hidden flex-1">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => onBack ? onBack() : navigateToPreviousRoute(navigate, '/')} className="rounded-xl h-10 w-10 shrink-0" title="Go back to previous page">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> Quality & QA/QC Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Site inspections, quantity & measurement clearance, non-conformance reporting (NCR), and sign-offs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search inspections, dwg#, NCRs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* View Mode Toggle: List / Grid / Table */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={() => setActiveView(activeView === 'analytics' ? 'inspections' : 'analytics')}
            variant={activeView === 'analytics' ? 'default' : 'outline'}
            className={`gap-1.5 rounded-xl h-10 px-3.5 text-xs font-bold transition-all ${
              activeView === 'analytics'
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                : 'border-purple-200 dark:border-purple-900/50 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <Layers className="h-4 w-4" />
            {activeView === 'analytics' ? 'Inspections List' : 'Overalls & RFI Totals'}
          </Button>

          <Button
            onClick={() => setIsPrintModalOpen(true)}
            variant="outline"
            className="gap-1.5 rounded-xl h-10 px-3.5 text-xs font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
            title="Print or Export QA/QC Inspection Register"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" /> Print Register
          </Button>

          <Button
            onClick={() => navigate('/documents?category=QA/QC%20Inspections')}
            variant="outline"
            className="gap-1.5 rounded-xl h-10 px-3.5 text-xs font-semibold border-blue-200 dark:border-blue-900/50 text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <FolderOpen className="h-4 w-4" /> QA Document Hub
          </Button>

          {canEditQuality && (
            <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 shrink-0 text-xs font-semibold shadow-xs">
              <Plus className="h-4 w-4" /> Log Inspection
            </Button>
          )}
        </div>
      </div>

      {activeView === 'analytics' ? (
        <QualityTotalsAnalytics
          onBackToInspections={() => setActiveView('inspections')}
          onSelectInspection={(item) => setSelectedInspection(item)}
        />
      ) : (
        <>

      {/* Log Inspection Form Modal/Drawer */}
      {isAdding && (
        <Card className="p-6 border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 w-full shadow-md animate-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleAddInspection} className="flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900/60 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> New QA/QC Inspection & Measurement Record
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* General Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspection Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Survey and setting out of MV Cable Trench: PTS20 - PTS21"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Linked Activities ({selectedActivityIds.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActivitySelectModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Select Activities
                  </button>
                </div>

                <div 
                  onClick={() => setIsActivitySelectModalOpen(true)}
                  className="min-h-10 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center flex-wrap gap-1.5 cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  {selectedActivityIds.length === 0 ? (
                    <span className="text-xs text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      Click to select & link activities to this inspection...
                    </span>
                  ) : (
                    <>
                      {selectedActivityIds.map(actId => {
                        const act = activities.find(a => a.id === actId);
                        return (
                          <span
                            key={actId}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 group shadow-2xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-mono font-bold">{actId}</span>
                            {act?.name && <span className="truncate max-w-[120px]">{act.name}</span>}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivityIds(prev => prev.filter(id => id !== actId));
                              }}
                              className="p-0.5 rounded-md hover:bg-emerald-200/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 hover:text-rose-600"
                              title="Remove activity link"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsActivitySelectModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-emerald-600 bg-emerald-100/60 dark:bg-emerald-950/40 hover:bg-emerald-200/80 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add More
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Location / Chainage / Block</label>
                <input
                  type="text"
                  placeholder="e.g. Block 20 to 21 / Chainage 0+000 to 0+150"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspector (QC/QA) *</label>
                <CustomSelect
                  value={inspector}
                  onChange={val => setInspector(val)}
                  options={employeeInspectorOptions}
                  placeholder="Select QC/QA Inspector..."
                  customPlaceholder="Enter custom inspector name..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspection Category</label>
                <CustomSelect
                  value={category}
                  onChange={val => setCategory(val)}
                  options={['Earthworks', 'Concrete', 'Structural Steel', 'Civil Utilities', 'Finishes', 'MEP Clearance', 'Survey & Setting Out']}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  customPlaceholder="Enter custom category..."
                />
              </div>
            </div>

            {/* Stakeholder & Engineering Reference Metadata */}
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#0B5FFF]" />
                  <span>Contractual Parties & Engineering Reference Documents</span>
                </h4>
                <span className="text-[11px] text-slate-400">Client, EPC, Subcontractor & Drawing reference</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Client */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    1. Client
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scatec Solar / Eskom / Anglo American"
                    value={client}
                    onChange={e => setClient(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                {/* 2. EPC Contractor */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    2. EPC Contractor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scedih Engineering (EPC)"
                    value={epc}
                    onChange={e => setEpc(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                {/* 3. Subcontractor */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    3. Subcontractor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Civils Direct / Specialist Subcontractor"
                    value={subcontractor}
                    onChange={e => setSubcontractor(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                {/* 4. Drawing / RFI / Document Numbers */}
                <div className="md:col-span-2 lg:col-span-3">
                  <MultiDrawingInput
                    label="4. Drawing / RFI / Document Numbers"
                    icon="document"
                    colorTheme="blue"
                    values={documentNumbers}
                    onChange={setDocumentNumbers}
                    placeholder="e.g. MVT-HDEC-MBEU-RFI-002, QA-ITR-042 (Press Enter to add multiple)"
                  />
                </div>

                {/* 5. Inspection Date and Time */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    5. Inspection Date & Time
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={inspectionDate}
                      onChange={e => setInspectionDate(e.target.value)}
                      className="w-full h-10 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                    <input
                      type="time"
                      value={inspectionTime}
                      onChange={e => setInspectionTime(e.target.value)}
                      className="w-full h-10 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                {/* 6. Submission Date */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    6. Submission Date
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={e => setSubmissionDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                {/* 7. Reference Drawing Numbers */}
                <div className="md:col-span-2 lg:col-span-3">
                  <MultiDrawingInput
                    label="7. Reference Plan / Layout Drawings"
                    icon="drawing"
                    colorTheme="purple"
                    values={referenceDrawingNumbers}
                    onChange={setReferenceDrawingNumbers}
                    placeholder="e.g. DWG-MV-201-REV-04, DWG-MV-202-REV-02, SEC-B-B"
                  />
                </div>
              </div>
            </div>

            {/* QA/QC Measurement Logic Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-emerald-600" />
                  <span>Quality Measurement & Scope Verification</span>
                </h4>
                <span className="text-[11px] text-slate-400">Specify what amount has to be or has been inspected</span>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {MEASUREMENT_PRESETS.map(preset => {
                  const isSelected = measurementType === preset.type;
                  return (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => {
                        setMeasurementType(preset.type);
                        setUnit(preset.unit);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quantity Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Target / Total Scope</label>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 150"
                      value={targetQuantity}
                      onChange={e => setTargetQuantity(e.target.value)}
                      className="w-full text-sm font-bold bg-transparent outline-none font-mono"
                    />
                    <span className="text-xs text-slate-400 font-bold shrink-0">{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mb-1">Amount Inspected</label>
                  <div className="flex items-center gap-1 bg-blue-50/50 dark:bg-blue-950/40 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 120"
                      value={inspectedQuantity}
                      onChange={e => {
                        const val = e.target.value;
                        setInspectedQuantity(val);
                        if (!approvedQuantity || approvedQuantity === '0') {
                          setApprovedQuantity(val);
                        }
                      }}
                      className="w-full text-sm font-bold text-[#0B5FFF] bg-transparent outline-none font-mono"
                    />
                    <span className="text-xs text-blue-400 font-bold shrink-0">{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Amount Approved</label>
                  <div className="flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 100"
                      value={approvedQuantity}
                      onChange={e => setApprovedQuantity(e.target.value)}
                      className="w-full text-sm font-bold text-emerald-600 bg-transparent outline-none font-mono"
                    />
                    <span className="text-xs text-emerald-400 font-bold shrink-0">{unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block mb-1">Amount Rejected / Defective</label>
                  <div className="flex items-center gap-1 bg-rose-50/50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800">
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 20"
                      value={rejectedQuantity}
                      onChange={e => setRejectedQuantity(e.target.value)}
                      className="w-full text-sm font-bold text-rose-600 bg-transparent outline-none font-mono"
                    />
                    <span className="text-xs text-rose-400 font-bold shrink-0">{unit}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tolerance / Testing Specification</label>
                <input
                  type="text"
                  placeholder="e.g. ±10mm level tolerance / SANS 1200 / Min 30 MPa"
                  value={toleranceSpec}
                  onChange={e => setToleranceSpec(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm">
                Submit Inspection Record
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Passed' ? 'All' : 'Passed')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Passed' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {qaInspections.filter(i => i.status === 'Passed').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Passed Inspections</div>
          </div>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'All' : 'Failed')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Failed' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {qaInspections.filter(i => i.status === 'Failed').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Failed / Open NCRs</div>
          </div>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'All' : 'Pending Approval')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Pending Approval' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {qaInspections.filter(i => i.status === 'Pending Approval').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold">Pending QA Signoff</div>
          </div>
        </Card>

        <Card 
          onClick={() => setActiveView('analytics')}
          className="p-4 flex items-center gap-3 border-slate-200 dark:border-slate-800 bg-blue-50/20 dark:bg-blue-950/20 hover:border-blue-400 cursor-pointer transition-all hover:bg-blue-50/40"
        >
          <div className="p-3 rounded-xl bg-blue-100 text-[#0B5FFF] dark:bg-blue-900/40">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {totalTrackedApproved.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
            </div>
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>Approved Scope</span>
              {totalTrackedTarget > 0 && (
                <span className="text-emerald-600 font-bold font-mono">({overallApprovalRate}%)</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Inspections List or Grid View */}
      {filteredInspections.length === 0 ? (
        <Card className="p-8 text-center border-slate-200 dark:border-slate-800">
          <ShieldCheck className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">No QA/QC inspections match the active search or filters.</p>
        </Card>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3.5 w-full">
          {filteredInspections.map(item => {
            const attachedDocCount = (documents || []).filter(d => 
              (item.linkedDocumentIds && item.linkedDocumentIds.includes(d.id)) ||
              d.linkedQAInspectionId === item.id ||
              (d.tags && d.tags.includes(item.id))
            ).length;

            const targetQty = item.targetQuantity || 0;
            const inspectedQty = item.inspectedQuantity || 0;
            const approvedQty = item.approvedQuantity || 0;
            const rejectedQty = item.rejectedQuantity || 0;
            const itemUnit = item.unit || 'm';
            const mType = item.measurementType || 'Length';

            const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
            const overallApprovedPercent = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0;
            const rejectionPercent = inspectedQty > 0 ? Math.round((rejectedQty / inspectedQty) * 100) : 0;

            const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
              ? item.documentNumbers
              : (item.documentNumber 
                  ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) 
                  : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));
            const subjectNumbers = docNumbers;

            return (
              <Card 
                key={item.id} 
                onClick={() => setSelectedInspection(item)}
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col gap-2 flex-1">
                  {/* Tags line */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-emerald-600">{item.id}</span>

                    {item.submissionDate && (
                      <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Submitted: {item.submissionDate}
                      </span>
                    )}

                    <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {item.category}
                    </Badge>
                    
                    {/* Measurement Badge */}
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Ruler className="h-3 w-3" /> {mType} ({itemUnit})
                    </span>

                    {item.toleranceSpec && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {item.toleranceSpec}
                      </span>
                    )}

                    {item.ncrCode && (
                      <Badge variant="danger" className="text-[10px] font-mono">{item.ncrCode}</Badge>
                    )}
                    {attachedDocCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                        <FolderOpen className="h-3 w-3" /> {attachedDocCount} {attachedDocCount === 1 ? 'Doc' : 'Docs'}
                      </span>
                    )}
                  </div>

                  {/* Primary Subject Heading (Drawing/Doc Numbers as Subject) */}
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors flex items-center gap-2 flex-wrap">
                    {subjectNumbers.length > 0 ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {subjectNumbers.map((num, i) => (
                            <span key={i} className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-bold shadow-2xs">
                              {num}
                            </span>
                          ))}
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
                        <span>{item.title}</span>
                      </>
                    ) : (
                      <span>{item.title}</span>
                    )}
                  </h3>

                  {/* Metadata: Location, Inspector, Date & Time, Submission Date, Stakeholders */}
                  <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap">
                    <span>Location: <strong className="text-slate-700 dark:text-slate-300">{item.location}</strong></span>
                    <span>Inspector: <strong className="text-slate-700 dark:text-slate-300">{item.inspector}</strong></span>
                    <span>Inspection Date: <strong className="text-slate-700 dark:text-slate-300">{item.date} {item.inspectionTime ? `@ ${item.inspectionTime}` : ''}</strong></span>
                    {item.submissionDate && <span>Submitted: <strong className="text-slate-700 dark:text-slate-300">{item.submissionDate}</strong></span>}
                    {item.client && <span>Client: <strong className="text-slate-700 dark:text-slate-300">{item.client}</strong></span>}
                    {item.epc && <span>EPC: <strong className="text-slate-700 dark:text-slate-300">{item.epc}</strong></span>}
                    {item.subcontractor && <span>Subcontractor: <strong className="text-slate-700 dark:text-slate-300">{item.subcontractor}</strong></span>}
                  </div>

                  {/* QA Measurement Progress Breakdown */}
                  {(targetQty > 0 || inspectedQty > 0) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 mt-1 space-y-1.5 max-w-xl">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span className="text-slate-400 font-normal">Scope:</span>
                          <span className="font-mono">{targetQty} {itemUnit}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-500 font-mono">Inspected: {inspectedQty} {itemUnit}</span>
                        </span>
                        
                        <div className="flex items-center gap-2 text-xs font-mono">
                          {approvedQty > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                ✓ {approvedQty} {itemUnit}
                              </span>
                              {targetQty > 0 ? (
                                <span 
                                  className="text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md text-[11px] border border-emerald-200 dark:border-emerald-800 shadow-2xs" 
                                  title={`Overall Scope: ${approvedQty}/${targetQty} ${itemUnit} (${overallApprovedPercent}%), Inspected Clearance: ${approvedQty}/${inspectedQty} ${itemUnit} (${approvalPercent}%)`}
                                >
                                  {overallApprovedPercent}% overall ({approvalPercent}% of inspected)
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-bold">
                                  ({approvalPercent}%)
                                </span>
                              )}
                            </div>
                          )}
                          {rejectedQty > 0 && (
                            <span className="text-rose-600 font-bold">
                              ✗ {rejectedQty} {itemUnit} ({rejectionPercent}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual segmented bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                          title={`Approved: ${approvedQty} ${itemUnit}`}
                        />
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : rejectionPercent}%` }}
                          title={`Rejected: ${rejectedQty} ${itemUnit}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions & Status */}
                <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
                  {/* Measure & Log Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMeasuringInspection(item);
                    }}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  >
                    <Ruler className="h-3.5 w-3.5" /> Measure / Quantities
                  </Button>

                  {/* Copy & Edit Inspection Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyInspection(item);
                    }}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    title="Copy and Edit this inspection"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy & Edit
                  </Button>

                  {/* Status Pills or Direct Buttons */}
                  {item.status === 'Passed' && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-4 w-4" /> Passed
                    </span>
                  )}
                  {item.status === 'Failed' && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                      <XCircle className="h-4 w-4" /> Failed (NCR)
                    </span>
                  )}
                  {item.status === 'Pending Approval' && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Passed'); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-3 font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Failed'); }}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs rounded-xl h-8 px-3 font-bold"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 w-full">
          {filteredInspections.map(item => {
            const attachedDocCount = (documents || []).filter(d => 
              (item.linkedDocumentIds && item.linkedDocumentIds.includes(d.id)) ||
              d.linkedQAInspectionId === item.id ||
              (d.tags && d.tags.includes(item.id))
            ).length;

            const targetQty = item.targetQuantity || 0;
            const inspectedQty = item.inspectedQuantity || 0;
            const approvedQty = item.approvedQuantity || 0;
            const rejectedQty = item.rejectedQuantity || 0;
            const itemUnit = item.unit || 'm';
            const mType = item.measurementType || 'Length';

            const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
            const rejectionPercent = inspectedQty > 0 ? Math.round((rejectedQty / inspectedQty) * 100) : 0;

            const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
              ? item.documentNumbers
              : (item.documentNumber 
                  ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) 
                  : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));
            const subjectNumbers = docNumbers;

            return (
              <Card 
                key={item.id} 
                onClick={() => setSelectedInspection(item)}
                className="p-5 flex flex-col justify-between gap-4 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all cursor-pointer group rounded-3xl"
              >
                <div className="space-y-3">
                  {/* Top Bar: ID + Status + Category */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {item.id}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {item.category}
                      </Badge>
                    </div>

                    {/* Status badge */}
                    {item.status === 'Passed' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                      </span>
                    )}
                    {item.status === 'Failed' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl border border-rose-200 dark:border-rose-800">
                        <XCircle className="h-3.5 w-3.5" /> Failed (NCR)
                      </span>
                    )}
                    {item.status === 'Pending Approval' && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                        <AlertCircle className="h-3.5 w-3.5" /> In Review
                      </span>
                    )}
                  </div>

                  {/* Primary Subject Line */}
                  <div className="space-y-1.5">
                    {subjectNumbers.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {subjectNumbers.map((num, i) => (
                          <span key={i} className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs font-bold shadow-2xs">
                            {num}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  {/* Measurement Progress Breakdown */}
                  {(targetQty > 0 || inspectedQty > 0) && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                          <Ruler className="h-3 w-3 text-emerald-600" />
                          <span>Scope: {targetQty} {itemUnit}</span>
                        </span>
                        <span className="font-mono text-blue-600 text-[11px]">
                          Inspected: {inspectedQty} {itemUnit}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                          title={`Approved: ${approvedQty} ${itemUnit}`}
                        />
                        <div 
                          className="h-full bg-rose-500 transition-all duration-300"
                          style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : rejectionPercent}%` }}
                          title={`Rejected: ${rejectedQty} ${itemUnit}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-emerald-600">✓ {approvedQty} {itemUnit}</span>
                          {targetQty > 0 ? (
                            <span 
                              className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800"
                              title={`Overall Scope: ${approvedQty}/${targetQty} ${itemUnit} (${targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0}%), Inspected Clearance: ${approvedQty}/${inspectedQty} ${itemUnit} (${approvalPercent}%)`}
                            >
                              {targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0}% overall ({approvalPercent}% insp.)
                            </span>
                          ) : (
                            <span className="text-emerald-600">({approvalPercent}%)</span>
                          )}
                        </div>
                        {rejectedQty > 0 && <span className="text-rose-600">✗ {rejectedQty} {itemUnit}</span>}
                      </div>
                    </div>
                  )}

                  {/* Metadata Chips */}
                  <div className="space-y-1 text-xs text-slate-500 pt-1">
                    <div className="flex items-center justify-between">
                      <span>Location:</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.location}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Inspector:</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{item.inspector}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Date:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.date}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMeasuringInspection(item);
                      }}
                      className="h-8 px-2 rounded-xl text-xs font-bold gap-1 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    >
                      <Ruler className="h-3.5 w-3.5" /> Measure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyInspection(item);
                      }}
                      className="h-8 px-2 rounded-xl text-xs font-bold gap-1 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      title="Copy and Edit this inspection"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>

                  {item.status === 'Pending Approval' && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Passed'); }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-2.5 font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Failed'); }}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs rounded-xl h-8 px-2.5 font-bold"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-2xl w-full">
          <div className="overflow-x-auto w-full max-w-full touch-pan-x scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs min-w-[950px]">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 whitespace-nowrap">Inspection ID & Date</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Subject & Reference Drawings</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Discipline & Spec</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Location & Inspector</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Physical Scope & Quantities</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInspections.map(item => {
                  const attachedDocCount = (documents || []).filter(d => 
                    (item.linkedDocumentIds && item.linkedDocumentIds.includes(d.id)) ||
                    d.linkedQAInspectionId === item.id ||
                    (d.tags && d.tags.includes(item.id))
                  ).length;

                  const targetQty = item.targetQuantity || 0;
                  const inspectedQty = item.inspectedQuantity || 0;
                  const approvedQty = item.approvedQuantity || 0;
                  const rejectedQty = item.rejectedQuantity || 0;
                  const itemUnit = item.unit || 'm';
                  const mType = item.measurementType || 'Length';

                  const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
                  const overallApprovedPercent = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0;
                  const rejectionPercent = inspectedQty > 0 ? Math.round((rejectedQty / inspectedQty) * 100) : 0;

                  const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
                    ? item.documentNumbers
                    : (item.documentNumber 
                        ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) 
                        : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));
                  const subjectNumbers = docNumbers;

                  return (
                    <tr 
                      key={item.id}
                      onClick={() => setSelectedInspection(item)}
                      className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {/* 1. ID & Dates */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-emerald-600 text-xs">
                          {item.id}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          {item.date}
                        </div>
                        {item.submissionDate && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                            Sub: {item.submissionDate}
                          </div>
                        )}
                      </td>

                      {/* 2. Subject & Drawings */}
                      <td className="py-3.5 px-4 align-top">
                        {subjectNumbers.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mb-1">
                            {subjectNumbers.map((num, i) => (
                              <span key={i} className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 text-[10px] font-bold shadow-2xs">
                                {num}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {item.client && <span className="text-[10px] text-slate-400">Client: <strong className="text-slate-600 dark:text-slate-300">{item.client}</strong></span>}
                          {item.epc && <span className="text-[10px] text-slate-400">EPC: <strong className="text-slate-600 dark:text-slate-300">{item.epc}</strong></span>}
                          {attachedDocCount > 0 && (
                            <span className="text-[10px] font-bold text-[#0B5FFF] flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded">
                              <FolderOpen className="h-3 w-3" /> {attachedDocCount} doc{attachedDocCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Discipline & Tolerance */}
                      <td className="py-3.5 px-4 align-top">
                        <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          {item.category}
                        </Badge>
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-emerald-600 shrink-0" /> {mType} ({itemUnit})
                        </div>
                        {item.toleranceSpec && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Spec: {item.toleranceSpec}
                          </div>
                        )}
                        {item.ncrCode && (
                          <Badge variant="danger" className="text-[9px] font-mono mt-1 block w-fit">
                            {item.ncrCode}
                          </Badge>
                        )}
                      </td>

                      {/* 4. Location & Inspector */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[160px]">
                          {item.location}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                          <User className="h-3 w-3 text-slate-400 shrink-0" />
                          {item.inspector}
                        </div>
                        {item.subcontractor && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                            Subcon: {item.subcontractor}
                          </div>
                        )}
                      </td>

                      {/* 5. Physical Scope & Quantities */}
                      <td className="py-3.5 px-4 align-top">
                        {(targetQty > 0 || inspectedQty > 0) ? (
                          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-850/80 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                              <span className="text-slate-500 font-normal">Scope: {targetQty} {itemUnit}</span>
                              <span className="text-blue-600">Insp: {inspectedQty} {itemUnit}</span>
                            </div>

                            {/* Segmented bar */}
                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                                title={`Approved: ${approvedQty} ${itemUnit}`}
                              />
                              <div 
                                className="h-full bg-rose-500 transition-all duration-300"
                                style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : rejectionPercent}%` }}
                                title={`Rejected: ${rejectedQty} ${itemUnit}`}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                              <span className="text-emerald-600 flex items-center gap-1">
                                ✓ {approvedQty} {itemUnit}
                                {targetQty > 0 ? (
                                  <span 
                                    className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 text-[9px]"
                                    title={`Overall Scope: ${approvedQty}/${targetQty} ${itemUnit} (${overallApprovedPercent}%), Inspected Clearance: ${approvedQty}/${inspectedQty} ${itemUnit} (${approvalPercent}%)`}
                                  >
                                    {overallApprovedPercent}% overall ({approvalPercent}% insp.)
                                  </span>
                                ) : (
                                  <span>({approvalPercent}%)</span>
                                )}
                              </span>
                              {rejectedQty > 0 && <span className="text-rose-600">✗ {rejectedQty}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No measurements</span>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'Passed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : item.status === 'Failed'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {item.status === 'Passed' && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === 'Failed' && <XCircle className="h-3 w-3" />}
                          {item.status === 'Pending Approval' && <Clock className="h-3 w-3" />}
                          {item.status}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMeasuringInspection(item);
                            }}
                            className="h-7 px-2 rounded-lg text-[11px] font-bold gap-1 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs"
                            title="Measure / Log Quantities"
                          >
                            <Ruler className="h-3 w-3" /> Measure
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyInspection(item);
                            }}
                            className="h-7 px-2 rounded-lg text-[11px] font-bold gap-1 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs"
                            title="Copy and Edit"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {item.status === 'Pending Approval' && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Passed'); }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] rounded-lg h-7 px-2 font-bold shadow-2xs"
                            >
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </>
      )}

      {/* Measurement Modal for Card Actions */}
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

      {/* Activity Multi-Select Modal */}
      <QAActivityMultiSelectModal
        isOpen={isActivitySelectModalOpen}
        onClose={() => setIsActivitySelectModalOpen(false)}
        selectedActivityIds={selectedActivityIds}
        onApply={(ids) => {
          setSelectedActivityIds(ids);
          if (ids.length > 0) {
            setActivityId(ids[0]);
          }
        }}
        activities={activities}
        projectId={projectId}
        projectName={projects.find(p => p.id === projectId)?.name}
      />

      {/* QA/QC Print Studio Modal */}
      <QAPrintRegisterModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        inspections={filteredInspections}
        allInspections={qaInspections}
        activeProject={projects.find(p => p.id === projectId) || projects[0]}
        initialLayoutMode={viewMode}
      />
    </div>
  );
}

export default QualityModule;
