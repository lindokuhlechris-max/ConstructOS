import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle,
  AlertTriangle, 
  Clock, 
  Ruler, 
  ZoomIn, 
  ZoomOut, 
  FileSpreadsheet, 
  Layers, 
  Building2, 
  Calendar, 
  User, 
  Check, 
  FileText,
  Sliders,
  Palette,
  Eye,
  LayoutGrid,
  List as ListIcon,
  Table as TableIcon
} from 'lucide-react';
import { Card, Button, Badge } from '../ui';
import { QAInspectionItem, Project } from '../../types';
import { printQAInspectionRegisterSummary } from '../../lib/pdfPrint';
import { saveOrShareFile } from '../../lib/fileExportService';

export interface QAPrintRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspections: QAInspectionItem[];
  allInspections?: QAInspectionItem[];
  activeProject?: Project;
  initialLayoutMode?: 'table' | 'grid' | 'list';
}

type ThemeColor = 'emerald' | 'navy' | 'slate' | 'monochrome';
type PageOrientation = 'landscape' | 'portrait';
type PrintLayoutMode = 'table' | 'grid' | 'list';

export const QAPrintRegisterModal: React.FC<QAPrintRegisterModalProps> = ({
  isOpen,
  onClose,
  inspections,
  allInspections,
  activeProject,
  initialLayoutMode = 'table'
}) => {
  const [printLayoutMode, setPrintLayoutMode] = useState<PrintLayoutMode>(initialLayoutMode);
  const [themeColor, setThemeColor] = useState<ThemeColor>('emerald');
  const [orientation, setOrientation] = useState<PageOrientation>(initialLayoutMode === 'table' ? 'landscape' : 'portrait');
  const [zoom, setZoom] = useState<number>(100);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Failed' | 'Pending Approval'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [includeKpiCards, setIncludeKpiCards] = useState<boolean>(true);
  const [includeScopeQuantities, setIncludeScopeQuantities] = useState<boolean>(true);
  const [includeSignoffs, setIncludeSignoffs] = useState<boolean>(true);
  const [includeContractors, setIncludeContractors] = useState<boolean>(true);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sync initial layout mode when opened
  useEffect(() => {
    if (isOpen) {
      setPrintLayoutMode(initialLayoutMode);
      if (initialLayoutMode === 'table') {
        setOrientation('landscape');
      }
    }
  }, [isOpen, initialLayoutMode]);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    (allInspections || inspections).forEach(i => {
      if (i.category) set.add(i.category);
    });
    return ['All', ...Array.from(set)];
  }, [allInspections, inspections]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let list = (allInspections && allInspections.length > 0) ? allInspections : inspections;

    if (statusFilter !== 'All') {
      list = list.filter(i => i.status === statusFilter);
    }
    if (categoryFilter !== 'All') {
      list = list.filter(i => i.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.inspector.toLowerCase().includes(q) ||
        (i.documentNumbers && i.documentNumbers.some(d => d.toLowerCase().includes(q))) ||
        (i.documentNumber && i.documentNumber.toLowerCase().includes(q)) ||
        (i.referenceDrawingNumber && i.referenceDrawingNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allInspections, inspections, statusFilter, categoryFilter, searchQuery]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = filteredData.length;
    const passed = filteredData.filter(i => i.status === 'Passed').length;
    const failed = filteredData.filter(i => i.status === 'Failed').length;
    const pending = filteredData.filter(i => i.status === 'Pending Approval').length;

    let targetSum = 0;
    let inspectedSum = 0;
    let approvedSum = 0;

    filteredData.forEach(i => {
      targetSum += (i.targetQuantity || 0);
      inspectedSum += (i.inspectedQuantity || 0);
      approvedSum += (i.approvedQuantity || 0);
    });

    const passRate = inspectedSum > 0 ? Math.round((approvedSum / inspectedSum) * 100) : (total > 0 ? Math.round((passed / total) * 100) : 0);
    const overallRate = targetSum > 0 ? Math.round((approvedSum / targetSum) * 100) : passRate;

    return { total, passed, failed, pending, targetSum, inspectedSum, approvedSum, passRate, overallRate };
  }, [filteredData]);

  if (!isOpen) return null;

  // Theme Styles
  const themeStyles = {
    emerald: {
      headerBg: 'bg-emerald-600',
      headerText: 'text-white',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      accentColor: '#059669',
      border: 'border-emerald-500'
    },
    navy: {
      headerBg: 'bg-[#0B5FFF]',
      headerText: 'text-white',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeText: 'text-blue-700 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-800',
      accentColor: '#0B5FFF',
      border: 'border-blue-500'
    },
    slate: {
      headerBg: 'bg-slate-800',
      headerText: 'text-white',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-700 dark:text-slate-300',
      badgeBorder: 'border-slate-300 dark:border-slate-700',
      accentColor: '#334155',
      border: 'border-slate-600'
    },
    monochrome: {
      headerBg: 'bg-black',
      headerText: 'text-white',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-900',
      badgeBorder: 'border-gray-300',
      accentColor: '#000000',
      border: 'border-black'
    }
  }[themeColor];

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    await printQAInspectionRegisterSummary({
      project: activeProject,
      inspections: filteredData,
      filterLabel: `${statusFilter !== 'All' ? statusFilter : 'All Statuses'} • ${categoryFilter !== 'All' ? categoryFilter : 'All Disciplines'} (${printLayoutMode.toUpperCase()} Layout)`,
      totalCount: (allInspections || inspections).length,
      orientation,
      includeSignoffs
    });
  };

  const handleExportCSV = async () => {
    const headers = [
      'Inspection ID',
      'Date',
      'Submission Date',
      'Title',
      'Drawing Numbers',
      'Discipline',
      'Measurement Type',
      'Unit',
      'Target Scope',
      'Inspected Quantity',
      'Approved Quantity',
      'Rejected Quantity',
      'Overall Approved %',
      'Tolerance Spec',
      'Location',
      'Inspector',
      'Subcontractor',
      'EPC',
      'Client',
      'Status'
    ];

    const rows = filteredData.map(i => {
      const docNums = (i.documentNumbers && i.documentNumbers.length > 0)
        ? i.documentNumbers.join('; ')
        : (i.documentNumber || i.referenceDrawingNumber || '');
      const target = i.targetQuantity || 0;
      const inspected = i.inspectedQuantity || 0;
      const approved = i.approvedQuantity || 0;
      const rejected = i.rejectedQuantity || 0;
      const overallPct = target > 0 ? Math.round((approved / target) * 100) : (inspected > 0 ? Math.round((approved / inspected) * 100) : 0);

      return [
        `"${i.id}"`,
        `"${i.date || ''}"`,
        `"${i.submissionDate || ''}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        `"${docNums.replace(/"/g, '""')}"`,
        `"${i.category || ''}"`,
        `"${i.measurementType || 'Length'}"`,
        `"${i.unit || 'm'}"`,
        target,
        inspected,
        approved,
        rejected,
        `${overallPct}%`,
        `"${(i.toleranceSpec || '').replace(/"/g, '""')}"`,
        `"${(i.location || '').replace(/"/g, '""')}"`,
        `"${(i.inspector || '').replace(/"/g, '""')}"`,
        `"${(i.subcontractor || '').replace(/"/g, '""')}"`,
        `"${(i.epc || '').replace(/"/g, '""')}"`,
        `"${(i.client || '').replace(/"/g, '""')}"`,
        `"${i.status}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `scedih_qa_inspection_register_${new Date().toISOString().split('T')[0]}.csv`;

    await saveOrShareFile({
      filename,
      blob,
      title: 'QA/QC Inspection Register CSV',
      text: 'Exported QA/QC Inspection Register spreadsheet'
    });
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:z-auto">
      
      {/* Modal Container */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Modal Top Header Bar - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  QA/QC Inspection Print Studio
                </h3>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                  {filteredData.length} records • {printLayoutMode.toUpperCase()} Layout
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Official contractor & client compliance sign-off printout in Table, Grid, or List formats.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700"
              title="Export CSV spreadsheet"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPDF}
              className="h-9 px-3 rounded-xl text-xs font-bold gap-1.5 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              title="Download Executive Vector PDF"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Printer className="h-4 w-4" /> Print Document
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Studio Body: Controls Sidebar + Document Preview Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Controls & Customization Sidebar - Hidden on Print */}
          <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 p-4 space-y-5 overflow-y-auto shrink-0 print:hidden text-xs">
            
            {/* 1. Printout Layout Mode: Table, Grid, List */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5" /> Printout Format / Layout
              </label>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setPrintLayoutMode('table');
                    setOrientation('landscape');
                  }}
                  className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    printLayoutMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Table View Layout"
                >
                  <TableIcon className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px]">Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('grid')}
                  className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    printLayoutMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="Grid / Card View Layout"
                >
                  <LayoutGrid className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px]">Grid</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrintLayoutMode('list')}
                  className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 transition-all ${
                    printLayoutMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="List Banner Layout"
                >
                  <ListIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-[10px]">List</span>
                </button>
              </div>
            </div>

            {/* 2. Filter Scope */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" /> Scope & Filters
              </label>
              
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Status</span>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                  >
                    <option value="All">All Statuses ({allInspections?.length || inspections.length})</option>
                    <option value="Passed">Passed Only ({stats.passed})</option>
                    <option value="Failed">Failed / NCRs ({stats.failed})</option>
                    <option value="Pending Approval">Pending Approval ({stats.pending})</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">Discipline Category</span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Orientation */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Paper Orientation
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`h-8 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'landscape'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Landscape (A4)
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`h-8 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'portrait'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Portrait (A4)
                </button>
              </div>
            </div>

            {/* 4. Color Theme */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Color Accent Theme
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'emerald', label: 'Emerald Quality', color: 'bg-emerald-500' },
                  { id: 'navy', label: 'Executive Navy', color: 'bg-blue-600' },
                  { id: 'slate', label: 'Slate Blueprint', color: 'bg-slate-700' },
                  { id: 'monochrome', label: 'Monochrome', color: 'bg-black' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setThemeColor(t.id as any)}
                    className={`h-8 px-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      themeColor === t.id
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${t.color}`} />
                    <span className="truncate text-[11px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Content Sections */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Document Sections
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeKpiCards}
                    onChange={e => setIncludeKpiCards(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Executive KPI Summary Cards</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeScopeQuantities}
                    onChange={e => setIncludeScopeQuantities(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Physical Measurement & Clearance</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeContractors}
                    onChange={e => setIncludeContractors(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Contractor & Client Metadata</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSignoffs}
                    onChange={e => setIncludeSignoffs(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Official Signature Sign-off Block</span>
                </label>
              </div>
            </div>

            {/* 6. Zoom Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Preview Zoom</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">{zoom}%</span>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.max(zoom - 15, 60))}
                  className="h-7 w-7 p-0 rounded-lg"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <input
                  type="range"
                  min="60"
                  max="150"
                  step="5"
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setZoom(Math.min(zoom + 15, 150))}
                  className="h-7 w-7 p-0 rounded-lg"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

          </div>

          {/* Document Preview Canvas Area */}
          <div className="flex-1 bg-slate-200/70 dark:bg-slate-950/70 p-4 sm:p-8 overflow-auto flex justify-center print:p-0 print:bg-white print:overflow-visible">
            
            {/* The Actual Printable Document Sheet */}
            <div 
              id="report-printable-area"
              ref={printAreaRef}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className={`bg-white text-slate-900 shadow-xl transition-transform duration-200 print:shadow-none print:transform-none print:w-full print:m-0 ${
                orientation === 'landscape'
                  ? 'w-[1050px] min-h-[740px] p-8 sm:p-10'
                  : 'w-[790px] min-h-[1118px] p-8 sm:p-10'
              }`}
            >
              
              {/* Document Header Banner */}
              <div className={`${themeStyles.headerBg} ${themeStyles.headerText} p-5 rounded-2xl mb-6 shadow-sm`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-6 w-6 text-white" />
                      <h1 className="text-xl font-bold tracking-tight">
                        SCEDIH — Quality & QA/QC Inspection Register
                      </h1>
                    </div>
                    <p className="text-xs text-white/90">
                      Official Inspection Test Plan (ITP) Clearance, Measurement Verification & Non-Conformance Log
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/90 space-y-0.5 font-mono">
                    <div className="font-bold text-sm text-white">
                      {activeProject?.name || 'Main Construction Site'}
                    </div>
                    <div>Date: {currentDateFormatted}</div>
                    <div className="uppercase">Layout: {printLayoutMode} View</div>
                  </div>
                </div>
              </div>

              {/* Sub-Header Metadata Strip */}
              <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-3 mb-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <span>
                    <strong>Project:</strong> {activeProject?.name || 'All Active Sites'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Filter:</strong> {statusFilter !== 'All' ? statusFilter : 'All Statuses'} ({categoryFilter !== 'All' ? categoryFilter : 'All Disciplines'})
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Total Records:</strong> {filteredData.length}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  CONFIDENTIAL • QUALITY ASSURANCE
                </div>
              </div>

              {/* KPI Summary Cards */}
              {includeKpiCards && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Inspections</span>
                    <span className="text-xl font-bold font-mono text-[#0B5FFF]">{stats.total}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">Passed & Cleared</span>
                    <span className="text-xl font-bold font-mono text-emerald-600">{stats.passed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">Open NCRs / Failed</span>
                    <span className="text-xl font-bold font-mono text-rose-600">{stats.failed}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-700 block">Pending Sign-off</span>
                    <span className="text-xl font-bold font-mono text-amber-600">{stats.pending}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">Overall Scope Approved</span>
                    <span className="text-xl font-bold font-mono text-emerald-600">{stats.overallRate}%</span>
                  </div>
                </div>
              )}

              {/* ==================================================================== */}
              {/* PRINT FORMAT 1: TABLE VIEW */}
              {/* ==================================================================== */}
              {printLayoutMode === 'table' && (
                <div className="overflow-x-auto border border-slate-200 rounded-xl mb-6">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3 whitespace-nowrap">ID & Date</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Subject & Reference Drawings</th>
                        <th className="py-2.5 px-3">Discipline & Spec</th>
                        <th className="py-2.5 px-3">Location & Inspector</th>
                        {includeScopeQuantities && <th className="py-2.5 px-3 min-w-[170px]">Scope & Measured Clearance</th>}
                        <th className="py-2.5 px-3 text-center">Status</th>
                        {includeContractors && <th className="py-2.5 px-3">Contractors</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredData.map(item => {
                        const targetQty = item.targetQuantity || 0;
                        const inspectedQty = item.inspectedQuantity || 0;
                        const approvedQty = item.approvedQuantity || 0;
                        const rejectedQty = item.rejectedQuantity || 0;
                        const itemUnit = item.unit || 'm';
                        const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
                        const overallPercent = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0;

                        const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
                          ? item.documentNumbers
                          : (item.documentNumber ? [item.documentNumber] : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 break-inside-avoid">
                            {/* 1. ID & Date */}
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-mono font-bold text-emerald-700">{item.id}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.date}</div>
                              {item.submissionDate && (
                                <div className="text-[9px] text-blue-600 font-mono">Sub: {item.submissionDate}</div>
                              )}
                            </td>

                            {/* 2. Subject & Drawing */}
                            <td className="py-2.5 px-3 align-top">
                              {docNumbers.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap mb-0.5">
                                  {docNumbers.map((num, idx) => (
                                    <span key={idx} className="font-mono text-blue-800 bg-blue-50 px-1 py-0.2 rounded border border-blue-200 text-[9px] font-bold">
                                      {num}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="font-bold text-slate-900 leading-snug">
                                {item.title}
                              </div>
                            </td>

                            {/* 3. Discipline */}
                            <td className="py-2.5 px-3 align-top">
                              <span className="font-semibold text-slate-700 block">{item.category}</span>
                              <span className="text-[10px] text-emerald-700 font-mono">
                                {item.measurementType || 'Length'} ({itemUnit})
                              </span>
                              {item.toleranceSpec && (
                                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                  Spec: {item.toleranceSpec}
                                </div>
                              )}
                              {item.ncrCode && (
                                <span className="inline-block mt-0.5 px-1 bg-rose-100 text-rose-800 font-mono font-bold rounded text-[9px]">
                                  {item.ncrCode}
                                </span>
                              )}
                            </td>

                            {/* 4. Location & Inspector */}
                            <td className="py-2.5 px-3 align-top">
                              <div className="font-medium text-slate-800">{item.location}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{item.inspector}</div>
                            </td>

                            {/* 5. Physical Scope & Quantities */}
                            {includeScopeQuantities && (
                              <td className="py-2.5 px-3 align-top font-mono">
                                {(targetQty > 0 || inspectedQty > 0) ? (
                                  <div className="space-y-0.5 text-[10px]">
                                    <div className="flex justify-between text-slate-600">
                                      <span>Scope: {targetQty} {itemUnit}</span>
                                      <span className="text-blue-600">Insp: {inspectedQty} {itemUnit}</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex my-0.5">
                                      <div 
                                        className="h-full bg-emerald-500" 
                                        style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                                      />
                                      <div 
                                        className="h-full bg-rose-500" 
                                        style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <div className="font-bold text-emerald-700 flex items-center justify-between">
                                      <span>✓ {approvedQty} {itemUnit}</span>
                                      <span>{overallPercent}% overall ({approvalPercent}% insp.)</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">No quantity</span>
                                )}
                              </td>
                            )}

                            {/* 6. Status */}
                            <td className="py-2.5 px-3 align-top text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'Passed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : item.status === 'Failed'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {item.status}
                              </span>
                            </td>

                            {/* 7. Contractors */}
                            {includeContractors && (
                              <td className="py-2.5 px-3 align-top text-[10px] text-slate-600">
                                {item.epc && <div>EPC: <strong>{item.epc}</strong></div>}
                                {item.subcontractor && <div>Sub: {item.subcontractor}</div>}
                                {item.client && <div>Client: {item.client}</div>}
                              </td>
                            )}
                          </tr>
                        );
                      })}

                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No QA/QC inspection records found for the selected criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ==================================================================== */}
              {/* PRINT FORMAT 2: GRID / CARD VIEW */}
              {/* ==================================================================== */}
              {printLayoutMode === 'grid' && (
                <div className={`grid gap-4 mb-6 ${orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {filteredData.map(item => {
                    const targetQty = item.targetQuantity || 0;
                    const inspectedQty = item.inspectedQuantity || 0;
                    const approvedQty = item.approvedQuantity || 0;
                    const rejectedQty = item.rejectedQuantity || 0;
                    const itemUnit = item.unit || 'm';
                    const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
                    const overallPercent = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0;

                    const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
                      ? item.documentNumbers
                      : (item.documentNumber ? [item.documentNumber] : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));

                    return (
                      <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 break-inside-avoid shadow-2xs">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {item.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Subject numbers */}
                        {docNumbers.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {docNumbers.map((num, idx) => (
                              <span key={idx} className="font-mono text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[10px] font-bold">
                                {num}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                          {item.title}
                        </div>

                        {/* Discipline & Spec */}
                        <div className="flex items-center justify-between text-[10px] text-slate-600">
                          <span className="font-semibold">{item.category} • {item.measurementType || 'Length'}</span>
                          {item.toleranceSpec && <span className="font-mono text-slate-500">Spec: {item.toleranceSpec}</span>}
                        </div>

                        {/* Progress Bar & Scope */}
                        {includeScopeQuantities && (targetQty > 0 || inspectedQty > 0) && (
                          <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-bold">
                              <span>Scope: {targetQty} {itemUnit}</span>
                              <span className="text-blue-600">Insp: {inspectedQty} {itemUnit}</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                              <div 
                                className="h-full bg-emerald-500" 
                                style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                              />
                              <div 
                                className="h-full bg-rose-500" 
                                style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : 0}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                              <span className="text-emerald-700">✓ {approvedQty} {itemUnit}</span>
                              <span className="text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">
                                {overallPercent}% overall ({approvalPercent}% insp.)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Location & Inspector */}
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-600 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Location:</span>
                            <strong className="text-slate-800 truncate max-w-[140px]">{item.location}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Inspector:</span>
                            <strong className="text-slate-800 truncate max-w-[140px]">{item.inspector}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Date:</span>
                            <span className="font-mono text-slate-700">{item.date}</span>
                          </div>
                          {includeContractors && item.epc && (
                            <div className="flex justify-between text-[9px] text-slate-500">
                              <span>EPC:</span>
                              <span className="truncate max-w-[140px]">{item.epc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ==================================================================== */}
              {/* PRINT FORMAT 3: LIST / WIDE BANNER VIEW */}
              {/* ==================================================================== */}
              {printLayoutMode === 'list' && (
                <div className="space-y-3 mb-6">
                  {filteredData.map(item => {
                    const targetQty = item.targetQuantity || 0;
                    const inspectedQty = item.inspectedQuantity || 0;
                    const approvedQty = item.approvedQuantity || 0;
                    const rejectedQty = item.rejectedQuantity || 0;
                    const itemUnit = item.unit || 'm';
                    const approvalPercent = inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0;
                    const overallPercent = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : 0;

                    const docNumbers = (item.documentNumbers && item.documentNumbers.length > 0)
                      ? item.documentNumbers
                      : (item.documentNumber ? [item.documentNumber] : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));

                    return (
                      <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 break-inside-avoid shadow-2xs">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.id}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.toleranceSpec && (
                              <span className="text-[10px] font-mono text-slate-500">
                                Spec: {item.toleranceSpec}
                              </span>
                            )}
                            {item.ncrCode && (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 font-mono font-bold rounded text-[10px]">
                                {item.ncrCode}
                              </span>
                            )}
                          </div>

                          {docNumbers.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {docNumbers.map((num, idx) => (
                                <span key={idx} className="font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs font-bold">
                                  {num}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="font-bold text-sm text-slate-900 leading-snug">
                            {item.title}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                            <span>Loc: <strong className="text-slate-700">{item.location}</strong></span>
                            <span>•</span>
                            <span>Insp: <strong className="text-slate-700">{item.inspector}</strong></span>
                            <span>•</span>
                            <span>Date: <span className="font-mono text-slate-700">{item.date}</span></span>
                            {includeContractors && item.epc && (
                              <>
                                <span>•</span>
                                <span>EPC: <strong>{item.epc}</strong></span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right side Scope & Status */}
                        <div className="shrink-0 w-full md:w-64 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">Inspection Status:</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.status === 'Passed' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'Failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>

                          {includeScopeQuantities && (targetQty > 0 || inspectedQty > 0) && (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-600">
                                <span>Scope: {targetQty} {itemUnit}</span>
                                <span className="text-blue-600">Insp: {inspectedQty} {itemUnit}</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                                <div 
                                  className="h-full bg-emerald-500" 
                                  style={{ width: `${targetQty > 0 ? (approvedQty / targetQty) * 100 : approvalPercent}%` }}
                                />
                                <div 
                                  className="h-full bg-rose-500" 
                                  style={{ width: `${targetQty > 0 ? (rejectedQty / targetQty) * 100 : 0}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                                <span className="text-emerald-700">✓ {approvedQty} {itemUnit}</span>
                                <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                                  {overallPercent}% overall ({approvalPercent}% insp.)
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Official Sign-off Signature Section */}
              {includeSignoffs && (
                <div className="mt-8 pt-4 border-t-2 border-slate-300 break-inside-avoid">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-6">
                    Official Quality Compliance & Verification Endorsements
                  </h4>

                  <div className="grid grid-cols-3 gap-8 text-xs">
                    {/* QA Inspector */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-400 pb-1 h-12 flex items-end">
                        <span className="text-slate-300 text-[10px] italic">Sign here</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Lead QA/QC Inspector</div>
                        <div className="text-[10px] text-slate-500">Inspection & Tolerance Clearance</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Date: ____________________</div>
                      </div>
                    </div>

                    {/* EPC Quality Lead */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-400 pb-1 h-12 flex items-end">
                        <span className="text-slate-300 text-[10px] italic">Sign here</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">EPC Construction Manager</div>
                        <div className="text-[10px] text-slate-500">Contractor Verification Sign-off</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Date: ____________________</div>
                      </div>
                    </div>

                    {/* Client Representative */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-400 pb-1 h-12 flex items-end">
                        <span className="text-slate-300 text-[10px] italic">Sign here</span>
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Client QC Representative</div>
                        <div className="text-[10px] text-slate-500">Owner & Consultant Approval</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Date: ____________________</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <div>SCEDIH Enterprise Construction Management System • Quality Module</div>
                <div>Generated: {new Date().toISOString()} • Confidential Document</div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
