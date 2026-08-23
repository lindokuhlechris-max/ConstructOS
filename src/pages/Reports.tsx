import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { DailyReport, UniversalReportItem, ReportCategory } from '../types';
import { ReportDetail } from '../components/ReportDetail';
import { DailyLogForm } from '../components/DailyLogForm';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { DailyPdfSummaryModal } from '../components/DailyPdfSummaryModal';
import { ProjectSummaryPdfModal } from '../components/ProjectSummaryPdfModal';
import { UniversalReportModal } from '../components/reports/UniversalReportModal';
import { UniversalReportDetail } from '../components/reports/UniversalReportDetail';
import { ProgressReportCompilerModal } from '../components/reports/ProgressReportCompilerModal';
import { ProgressReportDetail } from '../components/reports/ProgressReportDetail';
import { UniversalReportPrintStudioModal } from '../components/reports/UniversalReportPrintStudioModal';
import { ReportsHubPrintStudioModal } from '../components/reports/ReportsHubPrintStudioModal';
import {
  FileBarChart,
  Plus,
  Search,
  Filter,
  Calendar,
  CloudRain,
  Sun,
  Cloud,
  Wind,
  HardHat,
  Truck,
  ShieldAlert,
  AlertCircle,
  Trash2,
  ChevronRight,
  FileText,
  Eye,
  LayoutGrid,
  List as ListIcon,
  SlidersHorizontal,
  ArrowUpDown,
  TrendingUp,
  Users,
  Wrench,
  TriangleAlert,
  Clock,
  MapPin,
  Thermometer,
  Droplets,
  Download,
  Printer,
  FileSpreadsheet,
  Compass,
  DollarSign,
  Package,
  Home,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Layers,
  ChevronDown,
  Bookmark,
  Copy
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportReportsToCSV, exportFullProjectCSV } from '../lib/csvExport';
import { exportSingleReportPDF, exportMultipleReportsPDF } from '../lib/pdfReportExport';

export function Reports() {
  const { 
    reports, 
    universalReports, 
    addUniversalReport, 
    updateUniversalReport, 
    deleteUniversalReport,
    reportTemplates,
    projects, 
    activities, 
    addReport, 
    updateReport, 
    deleteReport, 
    hasPermission 
  } = useAppContext();

  const canEditReports = hasPermission('reports');

  // Navigation & Category Filter State
  const [activeCategory, setActiveCategory] = useState<ReportCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title' | 'status'>('date-desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Active Detail Selection
  const [selectedDailyReport, setSelectedDailyReport] = useState<DailyReport | null>(null);
  const [selectedUniversalReport, setSelectedUniversalReport] = useState<UniversalReportItem | null>(null);
  const [selectedProgressReport, setSelectedProgressReport] = useState<UniversalReportItem | null>(null);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState<UniversalReportItem | DailyReport | null>(null);

  // Creation & Wizard Modals
  const [isDailyCreating, setIsDailyCreating] = useState(false);
  const [isUniversalModalOpen, setIsUniversalModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<UniversalReportItem | null>(null);
  const [modalInitialCategory, setModalInitialCategory] = useState<ReportCategory>('Survey');

  const [isCompilerModalOpen, setIsCompilerModalOpen] = useState(false);

  // Exports Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isProjectSummaryPdfModalOpen, setIsProjectSummaryPdfModalOpen] = useState(false);
  const [isNewReportDropdownOpen, setIsNewReportDropdownOpen] = useState(false);
  const [isHubPrintStudioOpen, setIsHubPrintStudioOpen] = useState(false);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const formatReportTime = (createdAt?: string, fallbackDate?: string) => {
    if (createdAt) {
      // Check if it has an explicit time component (e.g. "T14:30", "14:30:00", etc.)
      const hasTimeComponent = createdAt.includes('T') || createdAt.includes(':');
      
      if (hasTimeComponent) {
        try {
          const d = new Date(createdAt);
          if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          }
        } catch (e) {}

        const timeMatch = createdAt.match(/(\d{2}:\d{2})/);
        if (timeMatch) return timeMatch[1];
      }
    }

    // If only a date is present, check if it is today or a previous shift
    const todayStr = new Date().toISOString().split('T')[0];
    if (fallbackDate === todayStr || createdAt === todayStr) {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // Default standard end-of-shift logging time for historical entries
    return '16:30';
  };

  // Convert daily reports to uniform list items for unified view
  const allUnifiedItems = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyAsUniversal: UniversalReportItem[] = reports.map(d => ({
      id: d.id,
      projectId: d.projectId,
      reportType: 'DAILY_SITE',
      category: 'DailySite',
      title: `Daily Site Report - ${d.date}`,
      documentNumber: `DLY-${d.date.replace(/-/g, '')}`,
      revision: 'Rev 0',
      date: d.date,
      submissionDate: d.date,
      createdAt: d.createdAt || (d.date === todayStr ? new Date().toISOString() : `${d.date}T16:30:00`),
      author: d.submittedBy || d.supervisor || 'Site Supervisor',
      status: (d.status as any) || 'Approved',
      location: 'Site-Wide',
      summaryNotes: d.workSummary || d.significantEvents || d.generalNotes || 'Daily construction activities and site conditions.',
      data: d
    }));

    return [...universalReports, ...dailyAsUniversal];
  }, [reports, universalReports]);

  // Filtered & Sorted unified report list
  const filteredAndSorted = useMemo(() => {
    let result = allUnifiedItems.filter(r => {
      // Category filter
      if (activeCategory !== 'all' && r.category !== activeCategory) {
        return false;
      }

      // Project filter
      if (filterProject !== 'all' && r.projectId !== filterProject) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(query);
        const matchesDoc = (r.documentNumber || '').toLowerCase().includes(query);
        const matchesAuthor = (r.author || '').toLowerCase().includes(query);
        const matchesLocation = (r.location || '').toLowerCase().includes(query);
        const matchesProject = getProjectName(r.projectId).toLowerCase().includes(query);
        return matchesTitle || matchesDoc || matchesAuthor || matchesLocation || matchesProject;
      }

      return true;
    });

    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        break;
      case 'date-asc':
        result.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        result.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
    }
    return result;
  }, [allUnifiedItems, activeCategory, filterProject, searchTerm, sortBy, projects]);

  // Aggregate Category Counts
  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: allUnifiedItems.length };
    allUnifiedItems.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [allUnifiedItems]);

  // Handle Opening a Report
  const handleOpenReport = (item: UniversalReportItem) => {
    if (item.category === 'WeeklyProgress' || item.category === 'MonthlyProgress') {
      setSelectedProgressReport(item);
    } else if (item.category === 'DailySite') {
      const origDaily = reports.find(r => r.id === item.id) || (item.data as DailyReport);
      setSelectedDailyReport(origDaily);
    } else {
      setSelectedUniversalReport(item);
    }
  };

  const handleOpenNewReportModal = (cat: ReportCategory) => {
    setIsNewReportDropdownOpen(false);
    setEditingReport(null);
    setModalInitialCategory(cat);
    setIsUniversalModalOpen(true);
  };

  const handleCopyReport = (item: UniversalReportItem) => {
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

    const newDocNumber = item.documentNumber ? incrementDocNumber(item.documentNumber) : `RPT-${Date.now().toString().slice(-4)}`;
    const newReport: UniversalReportItem = {
      ...item,
      id: `RPT-UNI-${Date.now()}`,
      documentNumber: newDocNumber,
      title: `${item.title} (Copy)`,
      date: new Date().toISOString().split('T')[0],
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Draft',
      signoffs: []
    };
    setEditingReport(newReport);
    setModalInitialCategory(item.category);
    setIsUniversalModalOpen(true);
  };

  // Render Sub-Views if a report is selected
  if (selectedProgressReport) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <ProgressReportDetail
          report={selectedProgressReport as any}
          onClose={() => setSelectedProgressReport(null)}
          onEdit={() => {
            setIsCompilerModalOpen(true);
          }}
          onSave={canEditReports ? (updated) => {
            updateUniversalReport(updated);
            setSelectedProgressReport(updated);
          } : undefined}
          onDelete={canEditReports ? (id) => {
            deleteUniversalReport(id);
            setSelectedProgressReport(null);
          } : undefined}
        />
      </div>
    );
  }

  if (selectedUniversalReport) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <UniversalReportDetail
          report={selectedUniversalReport}
          onClose={() => setSelectedUniversalReport(null)}
          onEdit={() => {
            setEditingReport(selectedUniversalReport);
            setModalInitialCategory(selectedUniversalReport.category);
            setIsUniversalModalOpen(true);
          }}
          onSave={canEditReports ? (updated) => {
            updateUniversalReport(updated);
            setSelectedUniversalReport(updated);
          } : undefined}
          onDelete={canEditReports ? (id) => {
            deleteUniversalReport(id);
            setSelectedUniversalReport(null);
          } : undefined}
        />
      </div>
    );
  }

  if (selectedDailyReport) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <ReportDetail
          report={selectedDailyReport}
          onSave={canEditReports ? (updated) => {
            updateReport(updated);
            setSelectedDailyReport(updated);
          } : undefined}
          onClose={() => setSelectedDailyReport(null)}
          onDelete={canEditReports ? (id) => {
            deleteReport(id);
            setSelectedDailyReport(null);
          } : undefined}
        />
      </div>
    );
  }

  // If creating a daily report
  if (isDailyCreating) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <DailyLogForm
          onSubmit={(formData) => {
            const newReport: DailyReport = {
              id: `RPT-${Date.now()}`,
              date: formData.date || new Date().toISOString().split('T')[0],
              projectId: formData.projectId || projects[0]?.id || 'PRJ-001',
              weather: formData.weather || 'Sunny',
              temperature: formData.temperature || '24°C',
              siteConditions: formData.siteConditions || 'Dry / Optimal',
              significantEvents: formData.significantEvents || '',
              workersOnSite: formData.workersOnSite ?? 12,
              equipmentRunning: formData.equipmentRunning ?? 3,
              incidents: formData.incidents ?? 0,
              ncr: formData.ncr ?? 0,
              supervisorNotes: formData.supervisorNotes || '',
              activitiesWorked: formData.activitiesWorked,
              activitiesLogged: formData.activitiesLogged,
              subtasksCompleted: formData.subtasksCompleted,
              pinnedSubtaskMap: formData.pinnedSubtaskMap,
              activityProgress: formData.activityProgress,
              workSummary: formData.workSummary || formData.significantEvents,
              status: 'Approved'
            };
            addReport(newReport);
            setIsDailyCreating(false);
          }}
          onCancel={() => setIsDailyCreating(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 gap-6 overflow-y-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-[#0B5FFF]" /> Reports & Templates Studio Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Universal report builder with customizable templates across Survey, Finance, Fleet, Materials, Camp, and QA/QC.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 relative">
          <Button 
            variant="outline"
            onClick={() => setIsHubPrintStudioOpen(true)}
            className="flex items-center gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
            title="Open Executive Reports & Dossier Print Studio"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            Print Hub
          </Button>

          <Button 
            variant="outline"
            onClick={() => exportMultipleReportsPDF(reports, projects, filterProject === 'all' ? undefined : getProjectName(filterProject))}
            className="flex items-center gap-1.5 border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 font-semibold"
            title="Export daily reports PDF"
          >
            <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Export Daily PDF
          </Button>

          <Button 
            variant="outline"
            onClick={() => exportReportsToCSV(reports, projects)}
            className="flex items-center gap-1.5 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold"
            title="Export reports to CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            CSV Export
          </Button>

          {/* New Report Universal Studio Dropdown */}
          {canEditReports && (
            <div className="relative">
              <Button 
                onClick={() => setIsNewReportDropdownOpen(!isNewReportDropdownOpen)}
                className="flex items-center gap-2 bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>New Report</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </Button>

              {isNewReportDropdownOpen && (
                <div className="absolute right-0 top-11 z-30 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-2 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Discipline Template
                  </div>

                  <button
                    onClick={() => handleOpenNewReportModal('Survey')}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 flex items-center justify-center shrink-0">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Survey & Geospatial Report</div>
                      <div className="text-[10px] text-slate-400">Setting-out, as-built, cut & fill volumes</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenNewReportModal('Finance')}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center shrink-0">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Finance & Valuation Claim (IPC)</div>
                      <div className="text-[10px] text-slate-400">Payment certs, BOQ progress, retention</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenNewReportModal('Fleet')}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Fleet, Plant & Machinery Log</div>
                      <div className="text-[10px] text-slate-400">Hour meters, fuel liters, availability</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleOpenNewReportModal('Materials')}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600 flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Materials Quality & Delivery</div>
                      <div className="text-[10px] text-slate-400">Mill test certificates, batch tests</div>
                    </div>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setIsNewReportDropdownOpen(false);
                      setIsCompilerModalOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0B5FFF] flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Compile Weekly / Monthly (WPR)</div>
                      <div className="text-[10px] text-slate-400">Auto-roll up site activities & progress</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewReportDropdownOpen(false);
                      setIsDailyCreating(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white flex items-center gap-3 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">New Daily Site Report</div>
                      <div className="text-[10px] text-slate-400">Daily labor, weather & shift diary</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total Reports Published</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{allUnifiedItems.length}</span>
            <span className="text-xs font-bold text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
              {reportTemplates.length} Templates
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Financial Claims Certified</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 font-mono">
              {universalReports.filter(r => r.category === 'Finance').length} Claims
            </span>
            <Badge className="bg-emerald-600 text-white text-[10px]">Valuation</Badge>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Survey Benchmarks Verified</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-teal-600">
              {universalReports.filter(r => r.category === 'Survey').length} Sets
            </span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
              ±15mm Tol
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Pending Approval / Review</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-amber-600">
              {allUnifiedItems.filter(r => r.status === 'Under Review' || r.status === 'Draft').length}
            </span>
            <span className="text-xs text-slate-400">Signoff Queue</span>
          </div>
        </div>
      </div>

      {/* Dual-Mode Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-slate-200 dark:border-slate-800 w-full shrink-0">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'all' 
              ? 'bg-[#0B5FFF] text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>All Reports ({countsByCategory.all || 0})</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

        <button
          onClick={() => setActiveCategory('Survey')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'Survey' 
              ? 'bg-teal-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="h-4 w-4 text-teal-500" />
          <span>Survey & Geospatial ({countsByCategory['Survey'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('Finance')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'Finance' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4 text-emerald-500" />
          <span>Finance & Claims ({countsByCategory['Finance'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('Fleet')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'Fleet' 
              ? 'bg-amber-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Truck className="h-4 w-4 text-amber-500" />
          <span>Fleet & Machinery ({countsByCategory['Fleet'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('Materials')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'Materials' 
              ? 'bg-orange-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="h-4 w-4 text-orange-500" />
          <span>Materials & Quality ({countsByCategory['Materials'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('Accommodation')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'Accommodation' 
              ? 'bg-cyan-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Home className="h-4 w-4 text-cyan-500" />
          <span>Camp & Accommodation ({countsByCategory['Accommodation'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('WeeklyProgress')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'WeeklyProgress' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Weekly (WPR) ({countsByCategory['WeeklyProgress'] || 0})</span>
        </button>

        <button
          onClick={() => setActiveCategory('DailySite')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeCategory === 'DailySite' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Daily Site Logs ({countsByCategory['DailySite'] || 0})</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports by title, doc number, author, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs w-full"
            />
          </div>

          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="title">Sort by Title</option>
            <option value="status">Sort by Status</option>
          </select>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reports Listing */}
      {filteredAndSorted.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] flex items-center justify-center mx-auto">
            <FileBarChart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No published reports match your active filter criteria. Click "New Report" to create or compile a new report.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredAndSorted.map(item => {
            const isSurvey = item.category === 'Survey';
            const isFinance = item.category === 'Finance';
            const isFleet = item.category === 'Fleet';
            const isMaterials = item.category === 'Materials';
            const isProgress = item.category === 'WeeklyProgress' || item.category === 'MonthlyProgress';

            return (
              <div 
                key={item.id}
                onClick={() => handleOpenReport(item)}
                className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSurvey ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 border border-teal-200 dark:border-teal-800' :
                    isFinance ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800' :
                    isFleet ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800' :
                    isMaterials ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border border-orange-200 dark:border-orange-800' :
                    isProgress ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] border border-blue-200 dark:border-blue-800' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {isSurvey ? <Compass className="h-5 w-5" /> :
                     isFinance ? <DollarSign className="h-5 w-5" /> :
                     isFleet ? <Truck className="h-5 w-5" /> :
                     isMaterials ? <Package className="h-5 w-5" /> :
                     isProgress ? <TrendingUp className="h-5 w-5" /> :
                     <Calendar className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-500">{item.documentNumber || item.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSurvey ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' :
                        isFinance ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        isFleet ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                        isMaterials ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' :
                        isProgress ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {item.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {(() => {
                      const docs = (item.documentNumbers && item.documentNumbers.length > 0)
                        ? item.documentNumbers
                        : (item.documentNumber 
                            ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) 
                            : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));

                      return (
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#0B5FFF] transition-colors flex items-center gap-2 flex-wrap">
                          {docs.length > 0 ? (
                            <>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {docs.map((num, i) => (
                                  <span key={i} className="font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 text-xs font-bold shadow-2xs">
                                    {num}
                                  </span>
                                ))}
                              </div>
                              <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>
                              <span className="truncate">{item.title}</span>
                            </>
                          ) : (
                            <span className="truncate">{item.title}</span>
                          )}
                        </h3>
                      );
                    })()}

                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-400 flex-wrap">
                      <span>Date: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.date}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        Time: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatReportTime(item.createdAt, item.date)}</strong>
                      </span>
                      <span>Submitted: <strong className="text-blue-600 dark:text-blue-400 font-mono">{item.submissionDate || item.date}</strong></span>
                      <span>Author: <strong className="text-slate-700 dark:text-slate-300">{item.author}</strong></span>
                      <span>Project: <strong className="text-slate-700 dark:text-slate-300">{getProjectName(item.projectId)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReportForPrint(item);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#0B5FFF] dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-500 transition-colors"
                    title="Open Print & PDF Studio"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-[#0B5FFF] font-semibold">
                    <span>View Detail</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map(item => {
            const isSurvey = item.category === 'Survey';
            const isFinance = item.category === 'Finance';
            const isFleet = item.category === 'Fleet';
            const isMaterials = item.category === 'Materials';
            const isProgress = item.category === 'WeeklyProgress' || item.category === 'MonthlyProgress';

            return (
              <div
                key={item.id}
                onClick={() => handleOpenReport(item)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                        isSurvey ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600' :
                        isFinance ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' :
                        isFleet ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' :
                        isMaterials ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600' :
                        isProgress ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF]' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        {isSurvey ? <Compass className="h-4 w-4" /> :
                         isFinance ? <DollarSign className="h-4 w-4" /> :
                         isFleet ? <Truck className="h-4 w-4" /> :
                         isMaterials ? <Package className="h-4 w-4" /> :
                         isProgress ? <TrendingUp className="h-4 w-4" /> :
                         <Calendar className="h-4 w-4" />}
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {item.documentNumber || item.id}
                      </Badge>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {(() => {
                      const docs = (item.documentNumbers && item.documentNumbers.length > 0)
                        ? item.documentNumbers
                        : (item.documentNumber 
                            ? item.documentNumber.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean) 
                            : (item.referenceDrawingNumber ? [item.referenceDrawingNumber] : []));

                      return docs.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {docs.map((num, i) => (
                            <span key={i} className="font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 text-[11px] font-bold">
                              {num}
                            </span>
                          ))}
                        </div>
                      ) : null;
                    })()}
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#0B5FFF] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.summaryNotes || 'Standard construction report filing.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span>📅 {item.date}</span>
                    <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-blue-500" /> {formatReportTime(item.createdAt, item.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[110px]">{item.author}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyReport(item);
                      }}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0B5FFF] dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-500 transition-colors"
                      title="Copy and Edit this report"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReportForPrint(item);
                      }}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#0B5FFF] dark:bg-slate-800 dark:hover:bg-blue-950/60 text-slate-500 transition-colors"
                      title="Print & PDF Studio"
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Universal Report & Template Studio Modal */}
      {isUniversalModalOpen && (
        <UniversalReportModal
          isOpen={isUniversalModalOpen}
          onClose={() => {
            setIsUniversalModalOpen(false);
            setEditingReport(null);
          }}
          initialReport={editingReport}
          initialCategory={modalInitialCategory}
          onSave={(savedReport) => {
            if (editingReport) {
              updateUniversalReport(savedReport);
            } else {
              addUniversalReport(savedReport);
            }
            setIsUniversalModalOpen(false);
            setEditingReport(null);
          }}
        />
      )}

      {/* Progress Report Compiler Modal */}
      {isCompilerModalOpen && (
        <ProgressReportCompilerModal
          isOpen={isCompilerModalOpen}
          onClose={() => setIsCompilerModalOpen(false)}
          onSave={(compiled) => {
            addUniversalReport(compiled);
            setIsCompilerModalOpen(false);
          }}
        />
      )}

      {/* Daily Weather PDF Modal */}
      {isPdfModalOpen && (
        <DailyPdfSummaryModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* Project Summary PDF Modal */}
      {isProjectSummaryPdfModalOpen && (
        <ProjectSummaryPdfModal
          isOpen={isProjectSummaryPdfModalOpen}
          onClose={() => setIsProjectSummaryPdfModalOpen(false)}
        />
      )}

      {/* Universal Report Print & PDF Studio Modal */}
      {selectedReportForPrint && (
        <UniversalReportPrintStudioModal
          isOpen={!!selectedReportForPrint}
          onClose={() => setSelectedReportForPrint(null)}
          report={selectedReportForPrint}
          reportType={('category' in selectedReportForPrint && selectedReportForPrint.category === 'DailySite') || 'weather' in selectedReportForPrint ? 'daily' : 'universal'}
        />
      )}

      {/* Executive Reports & Dossier Print Studio Modal */}
      {isHubPrintStudioOpen && (
        <ReportsHubPrintStudioModal
          isOpen={isHubPrintStudioOpen}
          onClose={() => setIsHubPrintStudioOpen(false)}
          reports={allUnifiedItems}
          allProjects={projects}
          activeCategoryFilter={activeCategory}
          activeProjectFilter={filterProject}
        />
      )}
    </div>
  );
}