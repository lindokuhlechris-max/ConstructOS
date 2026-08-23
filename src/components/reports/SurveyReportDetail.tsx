import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { 
  Compass, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Building2, 
  Layers, 
  FileText, 
  Scale, 
  Ruler, 
  Clock, 
  Navigation,
  Check,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { UniversalReportItem, SurveyReportData } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { UniversalReportPrintStudioModal } from './UniversalReportPrintStudioModal';

interface SurveyReportDetailProps {
  report: UniversalReportItem<SurveyReportData>;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (id: string) => void;
  onSave?: (updated: UniversalReportItem<SurveyReportData>) => void;
}

export function SurveyReportDetail({ report, onClose, onEdit, onDelete, onSave }: SurveyReportDetailProps) {
  const navigate = useNavigate();
  const { userRole, currentUserProfile } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pass' | 'Out of Tolerance'>('All');
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isPrintStudioOpen, setIsPrintStudioOpen] = useState(false);
  const [signoffNotes, setSignoffNotes] = useState('');

  const sData = report.data || {} as SurveyReportData;
  const points = sData.points || [];

  // Points stats
  const totalPoints = points.length;
  const passedPoints = points.filter(p => p.status === 'Pass').length;
  const failedPoints = points.filter(p => p.status === 'Out of Tolerance').length;
  const passRate = totalPoints > 0 ? Math.round((passedPoints / totalPoints) * 100) : 100;

  const maxDeltaE = points.reduce((max, p) => Math.max(max, Math.abs(p.deltaEasting)), 0);
  const maxDeltaN = points.reduce((max, p) => Math.max(max, Math.abs(p.deltaNorthing)), 0);
  const maxDeltaZ = points.reduce((max, p) => Math.max(max, Math.abs(p.deltaElevation)), 0);

  const filteredPoints = points.filter(p => {
    const matchesSearch = p.pointNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.chainage || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportPointsCSV = () => {
    const headers = ['PointNumber', 'Description', 'Chainage', 'DesignEasting', 'DesignNorthing', 'DesignElevation', 'ActualEasting', 'ActualNorthing', 'ActualElevation', 'DeltaE_mm', 'DeltaN_mm', 'DeltaZ_mm', 'Tolerance_mm', 'Status'];
    const rows = points.map(p => [
      `"${p.pointNumber}"`,
      `"${p.description}"`,
      `"${p.chainage || ''}"`,
      p.designEasting,
      p.designNorthing,
      p.designElevation,
      p.actualEasting,
      p.actualNorthing,
      p.actualElevation,
      p.deltaEasting,
      p.deltaNorthing,
      p.deltaElevation,
      p.toleranceMm,
      `"${p.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.documentNumber}_points_matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveSignoff = () => {
    if (!onSave) return;
    const newSignoff = {
      role: currentUserProfile?.role || 'Consultant / Lead Surveyor',
      name: currentUserProfile?.name || 'Authorized Engineer',
      date: new Date().toISOString().split('T')[0],
      status: 'Approved' as const,
      notes: signoffNotes || 'Coordinates and levels verified against design specifications.'
    };

    onSave({
      ...report,
      status: 'Approved',
      signoffs: [...(report.signoffs || []), newSignoff]
    });
    setIsSignoffModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      
      {/* Top Header & Overview Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => onClose ? onClose() : (window.history.length > 1 ? navigate(-1) : navigate('/reports'))}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-2"
                title="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Reports
              </button>
              <Badge variant="outline" className="font-mono text-xs text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800">
                {report.documentNumber}
              </Badge>
              <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {report.revision}
              </Badge>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                report.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                report.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {report.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Compass className="h-6 w-6 text-teal-600" /> {report.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4 flex-wrap">
              <span>Discipline: <strong className="text-slate-700 dark:text-slate-200">{sData.surveyType || 'As-Built'}</strong></span>
              <span>Survey Date: <strong className="text-slate-700 dark:text-slate-200">{report.date}</strong></span>
              <span>Submitted: <strong className="text-blue-600 dark:text-blue-400 font-mono">{report.submissionDate || report.date}</strong></span>
              <span>Surveyor: <strong className="text-slate-700 dark:text-slate-200">{report.author}</strong></span>
            </p>
          </div>

          {/* Action Buttons - Expandable Icons */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            {/* Print */}
            <button
              onClick={() => setIsPrintStudioOpen(true)}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Print Survey Report Studio"
            >
              <Printer className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-teal-600" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Print Studio
              </span>
            </button>

            {/* Export CSV */}
            <button
              onClick={exportPointsCSV}
              className="group h-9 px-2.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/70 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Export Points Matrix CSV"
            >
              <Download className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Export Points CSV
              </span>
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Edit Survey Report"
            >
              <Edit3 className="h-4 w-4 shrink-0 text-[#0B5FFF]" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Edit Report
              </span>
            </button>

            {/* Sign Off Approval */}
            {report.status !== 'Approved' && onSave && (
              <button
                onClick={() => setIsSignoffModalOpen(true)}
                className="group h-9 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
                title="Sign Off & Approve Report"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                  Approve Signoff
                </span>
              </button>
            )}

            {/* Delete */}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete Survey Report "${report.title}"?`)) {
                    onDelete(report.id);
                  }
                }}
                className="group h-9 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
                title="Delete Survey Record"
              >
                <Trash2 className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                  Delete
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total Points Verified</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalPoints}</span>
            <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
              {sData.surveyType || 'Survey'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Within Tolerance Rate</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${passRate >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {passRate}%
            </span>
            <span className="text-xs font-medium text-slate-500">{passedPoints} Pass / {failedPoints} Out</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Max Horizontal Deviation</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.max(maxDeltaE, maxDeltaN)} mm
            </span>
            <span className="text-xs text-slate-500">Tol: ±{sData.maxAllowedHorizontalToleranceMm || 15}mm</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Max Vertical Deviation</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {maxDeltaZ} mm
            </span>
            <span className="text-xs text-slate-500">Tol: ±{sData.maxAllowedVerticalToleranceMm || 10}mm</span>
          </div>
        </div>
      </div>

      {/* Grid: Geodetic Datum & Contractual Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Instrument & Geodetic System */}
        <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-teal-600" />
              <span>Geodetic & Calibration Setup</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-600 font-bold">CALIBRATED</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Instrument Model</span>
              <strong className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-teal-600" /> {sData.instrument || 'Total Station'}
              </strong>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Serial Number</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sData.instrumentSerialNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Calibration Date</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{sData.calibrationDate || 'Current'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Coordinate System</span>
              <span className="font-medium text-slate-900 dark:text-white">{sData.coordinateSystem || 'Lo29 / WGS84'}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Vertical Datum / Benchmark</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {sData.verticalDatum} {sData.benchmarkElevation ? `(@ ${sData.benchmarkElevation}m)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Stakeholder & Drawing Reference */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-[#0B5FFF]" />
              <span>Location, Drawing & Contractual Reference</span>
            </h3>
            <span className="text-[11px] text-slate-400">Formal Quality Submissions</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Client</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{report.client || 'Transnet Engineering'}</strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">EPC Contractor</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{report.epc || 'Scedih Engineering'}</strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Survey Subcontractor</span>
              <strong className="text-slate-900 dark:text-white font-semibold">{report.subcontractor || 'Apex Geomatics'}</strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Site Location</span>
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-rose-500" /> {report.location || 'Sector 4'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Reference Drawing Number</span>
              <strong className="font-mono text-[#0B5FFF] font-bold">{report.referenceDrawingNumber || 'DWG-SRV-01'}</strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Weather & Atmospheric</span>
              <span className="text-slate-700 dark:text-slate-300">{sData.weatherConditions || 'Clear, 24°C'}</span>
            </div>
          </div>

          {report.summaryNotes && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Survey Notes & Method Statement</span>
              <p className="text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {report.summaryNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Earthworks Volumetrics Card (if applicable) */}
      {sData.surveyType === 'Cut & Fill Volume' && (
        <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-amber-600" />
              <span>Earthworks Volumetric Analysis</span>
            </h3>
            <Badge className="bg-amber-600 text-white font-mono text-[10px]">
              Net Balance: {sData.netVolumeBalanceM3?.toLocaleString()} $m^3$
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-0.5">Survey Area</span>
              <strong className="text-slate-900 dark:text-white text-base">{sData.surveyAreaM2?.toLocaleString() || 0} $m^2$</strong>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-0.5">Design Cut</span>
              <span className="text-slate-700 dark:text-slate-300 text-base">{sData.designCutVolumeM3?.toLocaleString() || 0} $m^3$</span>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-0.5">Actual Cut Executed</span>
              <strong className="text-emerald-600 text-base">{sData.actualCutVolumeM3?.toLocaleString() || 0} $m^3$</strong>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-0.5">Actual Fill Executed</span>
              <strong className="text-blue-600 text-base">{sData.actualFillVolumeM3?.toLocaleString() || 0} $m^3$</strong>
            </div>

            <div>
              <span className="text-[10px] font-sans font-bold text-slate-400 uppercase block mb-0.5">Compaction Factor</span>
              <strong className="text-slate-900 dark:text-white text-base">{sData.compactionFactor || 1.15}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Coordinate Point Deviation Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ruler className="h-5 w-5 text-teal-600" />
              <span>Coordinate Point Deviation Matrix ({filteredPoints.length} of {points.length} Points)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Design vs As-Built coordinate offsets and elevation level check (Tolerance: ±{sData.maxAllowedHorizontalToleranceMm || 15}mm)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search point number or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="All">All Statuses</option>
              <option value="Pass">Pass Only</option>
              <option value="Out of Tolerance">Out of Tolerance Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold font-sans">
                <th className="p-3">Point #</th>
                <th className="p-3">Description / Chainage</th>
                <th className="p-3 text-right">Design East (m)</th>
                <th className="p-3 text-right">Design North (m)</th>
                <th className="p-3 text-right">Design Elev (m)</th>
                <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act East (m)</th>
                <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act North (m)</th>
                <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act Elev (m)</th>
                <th className="p-3 text-center">$\Delta E$ (mm)</th>
                <th className="p-3 text-center">$\Delta N$ (mm)</th>
                <th className="p-3 text-center">$\Delta Z$ (mm)</th>
                <th className="p-3 text-center font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-sans">
                    No survey points match the search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPoints.map((p) => {
                  const isFailE = Math.abs(p.deltaEasting) > (sData.maxAllowedHorizontalToleranceMm || 15);
                  const isFailN = Math.abs(p.deltaNorthing) > (sData.maxAllowedHorizontalToleranceMm || 15);
                  const isFailZ = Math.abs(p.deltaElevation) > (sData.maxAllowedVerticalToleranceMm || 10);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {p.pointNumber}
                      </td>
                      <td className="p-3 font-sans text-slate-600 dark:text-slate-300">
                        {p.description}
                        {p.chainage && <span className="block text-[10px] text-slate-400 font-mono">{p.chainage}</span>}
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">{p.designEasting.toFixed(3)}</td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">{p.designNorthing.toFixed(3)}</td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">{p.designElevation.toFixed(3)}</td>
                      
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">
                        {p.actualEasting.toFixed(3)}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">
                        {p.actualNorthing.toFixed(3)}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">
                        {p.actualElevation.toFixed(3)}
                      </td>

                      <td className={`p-3 text-center font-bold ${isFailE ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaEasting > 0 ? `+${p.deltaEasting}` : p.deltaEasting}
                      </td>
                      <td className={`p-3 text-center font-bold ${isFailN ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaNorthing > 0 ? `+${p.deltaNorthing}` : p.deltaNorthing}
                      </td>
                      <td className={`p-3 text-center font-bold ${isFailZ ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaElevation > 0 ? `+${p.deltaElevation}` : p.deltaElevation}
                      </td>

                      <td className="p-3 text-center font-sans">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Pass' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {p.status === 'Pass' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Signatory Sign-Off Sheet */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Formal Verification & Approval Signatures</span>
          </h3>
          <span className="text-[11px] text-slate-400">Quality Management Signoff Record</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(report.signoffs && report.signoffs.length > 0) ? (
            report.signoffs.map((sig, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{sig.role}</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Approved</Badge>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{sig.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">Date: {sig.date}</div>
                {sig.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    "{sig.notes}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              No formal signoffs recorded yet. Click "Approve Signoff" to record verification.
            </div>
          )}
        </div>
      </div>

      {/* Sign-Off Modal */}
      {isSignoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Approve Survey Signoff
            </h3>
            <p className="text-xs text-slate-500">
              Confirm that setting-out coordinates and elevations have been verified in compliance with project drawing specifications.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval Comments / Notes</label>
              <textarea
                rows={3}
                value={signoffNotes}
                onChange={e => setSignoffNotes(e.target.value)}
                placeholder="e.g. Setting-out tolerance passed. Approved for structural trench casting."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsSignoffModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleApproveSignoff} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Report Print & PDF Studio Modal */}
      {isPrintStudioOpen && (
        <UniversalReportPrintStudioModal
          isOpen={isPrintStudioOpen}
          onClose={() => setIsPrintStudioOpen(false)}
          report={report}
          reportType="universal"
        />
      )}
    </div>
  );
}
