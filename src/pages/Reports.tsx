import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../components/ui';
import { DailyReport } from '../types';
import { ReportDetail } from '../components/ReportDetail';
import { DailyLogForm } from '../components/DailyLogForm';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { DailyPdfSummaryModal } from '../components/DailyPdfSummaryModal';
import { ProjectSummaryPdfModal } from '../components/ProjectSummaryPdfModal';
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
  Sunrise,
  Sunset,
  Download,
  Printer,
  FileSpreadsheet,
  Mic
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { exportReportsToCSV, exportFullProjectCSV } from '../lib/csvExport';
import { exportSingleReportPDF, exportMultipleReportsPDF } from '../lib/pdfReportExport';
import { RecordActivityModal } from '../components/RecordActivityModal';
import { WeatherWidget } from '../components/WeatherWidget';

export function Reports() {
  const { reports, projects, activities, addReport, updateReport, deleteReport, addAuditLog, userRole } = useAppContext();


  

  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isProjectSummaryPdfModalOpen, setIsProjectSummaryPdfModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'workers' | 'incidents'>('date-desc');
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getWeatherIcon = (weather: string) => {
    const w = weather.toLowerCase();
    if (w.includes('rain') || w.includes('storm')) return <CloudRain className="h-4 w-4 text-blue-500" />;
    if (w.includes('cloud') || w.includes('overcast')) return <Cloud className="h-4 w-4 text-slate-400" />;
    if (w.includes('wind')) return <Wind className="h-4 w-4 text-teal-500" />;
    return <Sun className="h-4 w-4 text-amber-500" />;
  };

  const filteredAndSorted = useMemo(() => {
    let result = reports.filter(r => {
      const matchesSearch =
        r.date.includes(searchTerm) ||
        getProjectName(r.projectId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.weather.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.significantEvents || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProject = filterProject === 'all' || r.projectId === filterProject;
      return matchesSearch && matchesProject;
    });

    switch (sortBy) {
      case 'date-desc':
        result.sort((a, b) => b.date.localeCompare(a.date));
        break;
      case 'date-asc':
        result.sort((a, b) => a.date.localeCompare(b.date));
        break;
      case 'workers':
        result.sort((a, b) => b.workersOnSite - a.workersOnSite);
        break;
      case 'incidents':
        result.sort((a, b) => b.incidents - a.incidents);
        break;
    }
    return result;
  }, [reports, searchTerm, filterProject, sortBy, projects]);

  // Summary stats
  const totalReports = reports.length;
  const totalWorkerDays = reports.reduce((sum, r) => sum + r.workersOnSite, 0);
  const totalIncidents = reports.reduce((sum, r) => sum + r.incidents, 0);
  const totalNCRs = reports.reduce((sum, r) => sum + r.ncr, 0);

  const handleCreateReport = (formData: Partial<DailyReport>) => {
    const newReport: DailyReport = {
      id: `RPT-${Date.now()}`,
      date: formData.date || new Date().toISOString().split('T')[0],
      projectId: formData.projectId || '',
      weather: formData.weather || 'Sunny',
      temperature: formData.temperature || '',
      siteConditions: formData.siteConditions || '',
      significantEvents: formData.significantEvents || '',
      workersOnSite: formData.workersOnSite || 0,
      equipmentRunning: formData.equipmentRunning || 0,
      incidents: formData.incidents || 0,
      ncr: formData.ncr || 0,
      supervisorNotes: formData.supervisorNotes || '',
    };
    addReport(newReport);
    setIsCreating(false);
  };

  const handleDeleteReport = () => {
    if (deletingReportId) {
      deleteReport(deletingReportId);
      if (selectedReport && selectedReport.id === deletingReportId) {
        setSelectedReport(null);
      }
      setDeletingReportId(null);
    }
  };

  // Show create form
  if (isCreating) {
    return (
      <div className="p-4 md:p-8">
        <DailyLogForm onSubmit={handleCreateReport} onCancel={() => setIsCreating(false)} />
      </div>
    );
  }

  // Show detail view
  if (selectedReport) {
    return (
      <div className="p-4 md:p-8">
        <ReportDetail
          report={selectedReport}
          onSave={(updated) => {
            updateReport(updated);
            setSelectedReport(updated);
          }}
          onClose={() => setSelectedReport(null)}
          onDelete={(id) => {
            deleteReport(id);
            setSelectedReport(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-6 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-blue-500" /> Daily Site Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Create, review, and manage daily construction site reports.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
            title="Print current report view using browser print"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            Print Reports
          </Button>

          <Button 
            variant="outline"
            onClick={() => exportMultipleReportsPDF(filteredAndSorted, projects, filterProject === 'all' ? undefined : getProjectName(filterProject))}
            className="flex items-center gap-1.5 border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 font-semibold"
            title="Export filtered daily reports as a PDF document"
          >
            <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Export Reports PDF
          </Button>

          <Button 
            variant="outline"
            onClick={() => exportReportsToCSV(filteredAndSorted, projects)}
            className="flex items-center gap-1.5 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold"
            title="Export daily site reports to offline CSV file"
          >
            <FileSpreadsheet
className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Export Reports CSV
          </Button>

          <Button 
            variant="outline"
            onClick={() => exportFullProjectCSV(activities, reports, projects, filterProject === 'all' ? undefined : filterProject)}
            className="flex items-center gap-1.5 border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300 font-semibold"
            title="Export combined activities and reports dataset to CSV"
          >
            <FileSpreadsheet
className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Export Full Dataset CSV
          </Button>

          <Button 
            variant="outline"
            onClick={() => setIsProjectSummaryPdfModalOpen(true)}
            className="flex items-center gap-1.5 border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-[#0B5FFF] dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 font-semibold"
          >
            <FileText className="h-4 w-4" />
            Project Summary PDF
          </Button>

          <Button onClick={() => setIsPdfModalOpen(true)} className="flex items-center gap-1.5 border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300 font-semibold" variant="outline">
            <Download className="h-4 w-4" />
            Daily Weather PDF
          </Button>

          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-1.5 bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold">
            <Plus className="h-4 w-4" /> New Report
          </Button>
        </div>
      </div>


      <div className="flex flex-col-reverse lg:flex-row gap-6 flex-1 min-h-0">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Reports</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Worker-Days</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalWorkerDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Incidents</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalIncidents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">NCRs</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{totalNCRs}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reports by date, project, weather..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
          />
        </div>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="workers">Most Workers</option>
          <option value="incidents">Most Incidents</option>
        </select>
        <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2.5 ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileBarChart className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">No Reports Found</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
              {reports.length === 0 ? 'Create your first daily site report to get started.' : 'No reports match your search criteria.'}
            </p>
            {reports.length === 0 && (
              <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1" /> Create First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSorted.map(report => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200 dark:hover:border-blue-800"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                      {new Date(report.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getWeatherIcon(report.weather)}
                    <span className="text-xs text-slate-500">{report.weather}</span>
                  </div>
                </div>

                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3 truncate">
                  {getProjectName(report.projectId)}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <HardHat className="h-3.5 w-3.5 text-slate-400" />
                    <span>{report.workersOnSite} workers</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span>{report.equipmentRunning} equipment</span>
                  </div>
                  {report.incidents > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{report.incidents} incident{report.incidents !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {report.ncr > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{report.ncr} NCR{report.ncr !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {report.significantEvents && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                    {report.significantEvents}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono">{report.id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        exportSingleReportPDF(report, getProjectName(report.projectId));
                      }}
                      className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Export Daily Report as PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingReportId(report.id); }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAndSorted.map(report => (
            <Card
              key={report.id}
              className="cursor-pointer hover:shadow-md transition-shadow hover:border-blue-200 dark:hover:border-blue-800"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-3 md:p-4 flex items-center gap-4">
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 shrink-0">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                      {new Date(report.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium truncate">
                      — {getProjectName(report.projectId)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">{getWeatherIcon(report.weather)} {report.weather}</span>
                    <span className="flex items-center gap-1"><HardHat className="h-3 w-3" /> {report.workersOnSite}</span>
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {report.equipmentRunning}</span>
                    {report.incidents > 0 && (
                      <span className="flex items-center gap-1 text-red-500"><ShieldAlert className="h-3 w-3" /> {report.incidents}</span>
                    )}
                    {report.ncr > 0 && (
                      <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="h-3 w-3" /> {report.ncr}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      exportSingleReportPDF(report, getProjectName(report.projectId));
                    }}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Export Daily Report as PDF"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeletingReportId(report.id); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingReportId)}
        title="Delete Report"
        itemName={deletingReportId ? `Report from ${reports.find(r => r.id === deletingReportId)?.date || 'unknown date'}` : ''}
        message="Are you sure you want to delete this daily report? This action cannot be undone."
        onConfirm={handleDeleteReport}
        onCancel={() => setDeletingReportId(null)}
        confirmLabel="Delete Report"
      />

      {/* PDF Summary & Email Export Modal */}
      <DailyPdfSummaryModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />


        </div>
{/* Right Panel */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
          <WeatherWidget />
          
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex-1">
             <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
               <CardTitle className="text-sm flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-emerald-500" />
                 Active Sites
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
               <div className="flex flex-col">
                 {projects.filter(p => p.status === 'In Progress').map((project, i) => {
                   const colorClass = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'][i % 5];
                   const reportCount = reports.filter(r => r.projectId === project.id).length;
                   return (
                     <div key={project.id} className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                       <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${colorClass}`}></div>
                         <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={project.name}>{project.name}</span>
                       </div>
                       <span className="text-xs text-slate-400 font-mono">{reportCount} Rep{reportCount !== 1 && 's'}</span>
                     </div>
                   );
                 })}
                 {projects.filter(p => p.status === 'In Progress').length === 0 && (
                   <div className="p-4 text-center text-sm text-slate-500">No active sites found.</div>
                 )}
               </div>
             </CardContent>
          </Card>
        </div>
        
        
      </div>
      {/* Project Summary PDF Modal */}
      <ProjectSummaryPdfModal
        isOpen={isProjectSummaryPdfModalOpen}
        onClose={() => setIsProjectSummaryPdfModalOpen(false)}
        defaultProjectId={filterProject !== 'all' ? filterProject : undefined}
      />

      {isRecordingModalOpen && (
        <RecordActivityModal
          projectId={filterProject !== 'all' ? filterProject : (projects[0]?.id || '')}
          onClose={() => setIsRecordingModalOpen(false)}
          onReportGenerated={(report) => {
            const newReport: DailyReport = {
              id: `REP-${Date.now()}`,
              ...report
            } as DailyReport;
            addReport(newReport);
            setSelectedReport(newReport);
          }}
        />
      )}
    </div>
  );
}