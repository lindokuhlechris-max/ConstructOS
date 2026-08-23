import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, CustomSelect, ProgressBar } from './ui';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  CloudRain, 
  Sun, 
  Cloud, 
  HardHat, 
  Truck, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Printer, 
  Edit3, 
  Trash2, 
  Plus, 
  X, 
  Eye, 
  Building, 
  Users, 
  Activity as ActivityIcon, 
  Clock, 
  Wind, 
  Thermometer, 
  CheckSquare, 
  FileCheck,
  Package,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DailyReport, Activity, LabourLog, SafetyIncident, Equipment, MaterialReceipt } from '../types';
import { exportSingleReportPDF, parseSupervisorNotes } from '../lib/pdfReportExport';
import { normalizeLabourAssignments, getSubtaskProgressionNumber, getPersonInitials } from '../lib/labourUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportDetailProps {
  report: DailyReport;
  onSave: (updatedReport: DailyReport) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function ReportDetail({ report, onSave, onClose, onDelete }: ReportDetailProps) {
  const { activities, labourLogs, safetyIncidents, equipment, materialReceipts, projects, employees = [] } = useAppContext();

  // Active Tab: 'overview' | 'activities' | 'manpower' | 'equipment' | 'safety'
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'manpower' | 'equipment' | 'safety'>('overview');

  // Edit Report Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<DailyReport>({ ...report });

  // Supervisor Notes State
  const [supervisorNotes, setSupervisorNotes] = useState(report.supervisorNotes || '');

  // Parse Structured Notes (e.g. from Log Progress)
  const parsedNotes = useMemo(() => parseSupervisorNotes(report.supervisorNotes || ''), [report.supervisorNotes]);

  // Weather Icon Helper
  const getWeatherIcon = (weather: string) => {
    if (weather.toLowerCase().includes('rain')) return <CloudRain className="h-6 w-6 text-blue-500" />;
    if (weather.toLowerCase().includes('cloud')) return <Cloud className="h-6 w-6 text-slate-500" />;
    return <Sun className="h-6 w-6 text-yellow-500" />;
  };

  // Filter activities, labour, safety, equipment, materials relevant to this report date / project
  const dayActivities = activities.filter(a => (a.projectId === report.projectId) && (a.status === 'In Progress' || a.status === 'Completed'));
  const dayLabourLogs = labourLogs.filter(l => l.projectId === report.projectId && l.date === report.date);
  const daySafetyIncidents = safetyIncidents.filter(s => s.projectId === report.projectId && s.dateReported === report.date);
  const dayEquipment = equipment.filter(e => e.status === 'Operating');
  const dayMaterialDeliveries = (materialReceipts || []).filter(m => m.date === report.date);

  // Submit Edit Report Modal
  const handleEditReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editForm);
    setShowEditModal(false);
  };

  // Save Supervisor Notes
  const handleSaveNotes = () => {
    onSave({ ...report, supervisorNotes });
    alert('Daily report supervisor notes saved successfully!');
  };

  // Export PDF
  const handleExportPDF = () => {
    const proj = projects.find(p => p.id === report.projectId);
    const projectName = proj?.name || report.projectId;
    exportSingleReportPDF(report, projectName);
  };

  const handlePrint = () => {
    handleExportPDF();
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top Header Action Bar (Full Width) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-[#0B5FFF] dark:text-blue-300 shrink-0 shadow-sm">
              <FileText className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="font-mono text-xs">{report.id}</Badge>
                <Badge variant="default" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 text-xs font-bold">{report.projectId}</Badge>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {report.date}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Daily Site Log - {new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h1>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>

          <button
            onClick={() => { setEditForm({ ...report }); setShowEditModal(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Edit3 className="h-4 w-4 text-[#0B5FFF]" /> Edit Report
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(report.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar (Full Width) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sun className="h-4 w-4" /> Overview & Weather
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'activities'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ActivityIcon className="h-4 w-4" /> Daily Progress ({dayActivities.length})
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'manpower'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HardHat className="h-4 w-4" /> Manpower & Trades ({report.workersOnSite})
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'equipment'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="h-4 w-4" /> Equipment & Materials ({dayEquipment.length})
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'safety'
              ? 'border-[#0B5FFF] text-[#0B5FFF]'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="h-4 w-4" /> Safety & Inspection ({report.incidents})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & WEATHER */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Activity & Scope Header Card (if available from notes) */}
            {parsedNotes.activityTitle && (
              <Card className="w-full border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50/40 to-slate-50 dark:from-blue-950/20 dark:to-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0B5FFF] dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="h-4 w-4" /> Logged Construction Activity
                    </span>
                    {parsedNotes.priorityLevel && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {parsedNotes.priorityLevel} Priority
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {parsedNotes.activityTitle}
                  </CardTitle>
                  {parsedNotes.disciplinePackage && (
                    <p className="text-xs text-slate-500 mt-0.5">{parsedNotes.disciplinePackage}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Progress Status</span>
                    <p className="text-sm font-bold text-[#0B5FFF] mt-0.5">{parsedNotes.overallProgress || 'In Progress'}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Output Achieved</span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{parsedNotes.outputMeasured || 'Logged'}</p>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Hours Logged</span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5">{parsedNotes.hoursLogged || 'Shift Hours'}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subtask & Method Execution Breakdown Card (if subtasks parsed) */}
            {parsedNotes.subtasks && parsedNotes.subtasks.length > 0 && (
              <Card className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-emerald-600" />
                      Subtask & Execution Breakdown
                    </CardTitle>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      {parsedNotes.subtasks.filter(s => s.status.toLowerCase().includes('completed')).length} of {parsedNotes.subtasks.length} Completed ({Math.round((parsedNotes.subtasks.filter(s => s.status.toLowerCase().includes('completed')).length / parsedNotes.subtasks.length) * 100)}%)
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                        <tr>
                          <th className="px-3 py-2.5 w-10 text-center">#</th>
                          <th className="px-3 py-2.5">Subtask / Deliverable</th>
                          <th className="px-3 py-2.5">Category / WBS</th>
                          <th className="px-3 py-2.5 text-center">Output / Qty</th>
                          <th className="px-3 py-2.5 text-center">Type</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {parsedNotes.subtasks.map((s, idx) => {
                          const isDone = s.status.toLowerCase().includes('completed');
                          const isProg = s.status.toLowerCase().includes('progress');
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2.5 font-mono text-center text-slate-400 font-bold">{s.no}</td>
                              <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">
                                {s.title}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{s.category}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-700 dark:text-slate-300">{s.quantity}</td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {s.isMilestone && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                                      🎯 Milestone
                                    </span>
                                  )}
                                  {s.isHoldPoint && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                      s.holdPointApproved
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    }`} title={s.holdPointSigner ? `Signed off by ${s.holdPointSigner}` : 'QA Hold Point'}>
                                      🔒 {s.holdPointApproved ? `QA Signed: ${s.holdPointSigner || 'Passed'}` : 'QA Hold Point'}
                                    </span>
                                  )}
                                  {!s.isMilestone && !s.isHoldPoint && (
                                    <span className="text-[11px] text-slate-400">Standard</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                                  isProg ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' :
                                  'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                }`}>
                                  {isDone ? 'Completed ✓' : isProg ? 'In Progress ►' : 'Not Started'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weather & Site Conditions Card */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" /> Weather & Site Environment Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    {getWeatherIcon(report.weather)}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-400">Weather Condition</span>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{report.weather}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Thermometer className="h-3.5 w-3.5 text-rose-500" /> {report.temperature || '24°C Sunny'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase text-slate-400">Site Ground Conditions</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {report.siteConditions || 'Dry, clear access roads, no precipitation interference.'}
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Significant Site Events & Milestones</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {report.significantEvents || 'Substructure excavation phase completed. Quality inspection signed off for Zone A rebar installation.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Daily Supervisor Sign-Off Notes Card */}
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-[#0B5FFF]" /> Supervisor Daily Log & Sign-Off
                </CardTitle>
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B5FFF] text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FileCheck className="h-4 w-4" /> Save Notes
                </button>
              </CardHeader>
              <CardContent className="p-6">
                <textarea
                  rows={4}
                  placeholder="Record site supervisor summary, site handover comments, and next day planned focus areas..."
                  value={supervisorNotes}
                  onChange={e => setSupervisorNotes(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column: Metrics */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-800/80 border-blue-100 dark:border-slate-800 w-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Daily Executive Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <HardHat className="h-4 w-4 text-orange-500" /> Workers On Site
                  </span>
                  <Badge variant="default" className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 text-xs font-bold">
                    {report.workersOnSite} Personnel
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-blue-500" /> Machinery Running
                  </span>
                  <Badge variant="default" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 text-xs font-bold">
                    {report.equipmentRunning} Active Units
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-red-500" /> Safety Incidents
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${
                    report.incidents > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {report.incidents} Incidents
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Quality NCRs
                  </span>
                  <Badge variant="outline" className="text-xs font-bold">
                    {report.ncr} Issued
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ACTIVITIES PROGRESS */}
      {activeTab === 'activities' && (
        <div className="space-y-6 w-full">
          {/* Pinned Activities & Specific Daily Output Matrix */}
          {(report.pinnedSubtaskMap || report.activityProgress || (report.activitiesWorked && report.activitiesWorked.length > 0)) && (
            <Card className="w-full border-blue-200 dark:border-blue-900 shadow-sm">
              <CardHeader className="bg-blue-50/40 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/50">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <CheckSquare className="h-5 w-5 text-[#0B5FFF]" /> Pinned Shift Tasks & Daily Output Execution
                </CardTitle>
                <p className="text-xs text-slate-500">Activities and specific subtasks pinned to this daily site diary with physical output quantities.</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {activities
                  .filter(a => {
                    if (report.pinnedSubtaskMap && report.pinnedSubtaskMap[a.id]) return true;
                    if (report.activitiesLogged && report.activitiesLogged.includes(a.id)) return true;
                    if (report.activitiesWorked && report.activitiesWorked.includes(a.name)) return true;
                    return false;
                  })
                  .map(act => {
                    const prog = (report.activityProgress && report.activityProgress[act.id]) || {};
                    const pinnedMap = report.pinnedSubtaskMap ? report.pinnedSubtaskMap[act.id] : 'all';
                    const allSubtasks = act.subtasks || [];
                    const focusedSubtasks = !pinnedMap || pinnedMap === 'all'
                      ? allSubtasks
                      : allSubtasks.filter(s => Array.isArray(pinnedMap) && pinnedMap.includes(s.id));
                    const isPartial = Array.isArray(pinnedMap) && pinnedMap.length > 0 && pinnedMap.length < allSubtasks.length;
                    const completedSubtaskIds = prog.completedSubtasks || [];

                    const actLabour = normalizeLabourAssignments(act.assignedLabour, employees);
                    const actEquipment = act.assignedEquipment || [];

                    return (
                      <div 
                        key={act.id} 
                        className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-4 transition-all ${
                          isPartial ? 'border-indigo-200 dark:border-indigo-900/60' : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Header Strip */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-[#0B5FFF]">
                              {act.code || act.id}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {act.discipline || 'General'}
                            </span>
                            {act.sectionSpan && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                Span: {act.sectionSpan}
                              </span>
                            )}
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

                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {act.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overall Activity</span>
                              <span className="text-xs font-black text-[#0B5FFF]">{act.progress || 0}%</span>
                            </div>
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-[#0B5FFF] rounded-full transition-all duration-300"
                                style={{ width: `${act.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Subtasks Progression Breakdown */}
                        {focusedSubtasks.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400">
                                Subtask Deliverables & Daily Output ({focusedSubtasks.filter(s => s.status === 'Completed' || completedSubtaskIds.includes(s.id)).length}/{focusedSubtasks.length} Complete):
                              </span>
                            </div>

                            <div className="space-y-2">
                              {focusedSubtasks.map((st, sIdx) => {
                                const origIdx = allSubtasks.findIndex(s => s.id === st.id);
                                const progNum = getSubtaskProgressionNumber(allSubtasks, origIdx >= 0 ? origIdx : sIdx);
                                const isDone = st.status === 'Completed' || completedSubtaskIds.includes(st.id) || (report.subtasksCompleted && report.subtasksCompleted.some(s => s.includes(st.title)));

                                let itemPercent = 0;
                                if (st.targetQuantity && st.targetQuantity > 0) {
                                  itemPercent = Math.min(100, Math.round(((st.completedQuantity || 0) / st.targetQuantity) * 100));
                                } else {
                                  itemPercent = isDone ? 100 : st.status === 'In Progress' ? 50 : 0;
                                }

                                return (
                                  <div 
                                    key={st.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                                      isDone 
                                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' 
                                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      <div 
                                        className={`h-6 min-w-[2.4rem] px-1.5 rounded-lg font-mono font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs ${
                                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        {progNum}
                                      </div>

                                      {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                      ) : (
                                        <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                                      )}

                                      <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                                        {st.title}
                                      </span>

                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                        {st.category}
                                      </span>

                                      {st.isHoldPoint && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                                          🔒 QA Hold Point
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                      {st.targetQuantity ? (
                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                          {st.completedQuantity || 0} / {st.targetQuantity} {st.unit || act.unit || 'm'}
                                        </span>
                                      ) : null}

                                      <div className="w-14 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0 hidden sm:block">
                                        <div 
                                          className={`h-full rounded-full transition-all ${itemPercent === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'}`}
                                          style={{ width: `${itemPercent}%` }} 
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 w-8 text-right">
                                        {itemPercent}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {prog.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <strong>Shift Notes:</strong> {prog.notes}
                          </p>
                        )}

                        {/* Workforce & Machinery Bar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <HardHat className="h-3 w-3" /> Workforce on Shift:
                            </span>
                            {actLabour.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">No workers assigned</span>
                            ) : (
                              actLabour.map((l, lIdx) => (
                                <span key={lIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-[10px] font-bold">
                                  <span className="w-3.5 h-3.5 rounded bg-amber-200 dark:bg-amber-800 text-[8px] flex items-center justify-center font-bold">
                                    {getPersonInitials(l.name)}
                                  </span>
                                  {l.name} ({l.hours || 8}h)
                                </span>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Truck className="h-3 w-3" /> Machinery:
                            </span>
                            {actEquipment.length === 0 ? (
                              <span className="text-[11px] text-slate-400 italic">No equipment assigned</span>
                            ) : (
                              actEquipment.map((eq, eIdx) => (
                                <span key={eIdx} className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800/60 text-[10px] font-bold">
                                  {typeof eq === 'string' ? eq : (eq.name || eq.equipmentId || 'Equipment')}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          )}

          {/* All Project Active Activities Table */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-[#0B5FFF]" /> Construction Activities Active Today
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Task ID</th>
                      <th className="px-4 py-3">Activity Name</th>
                      <th className="px-4 py-3">Discipline</th>
                      <th className="px-4 py-3">Assigned Team</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {dayActivities.map(act => (
                      <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-[#0B5FFF]">{act.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{act.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px]">{act.discipline}</Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{act.assignedTo || 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            act.status === 'Completed' ? 'bg-green-50 text-green-700' :
                            act.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{act.progress}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: MANPOWER & TRADES */}
      {activeTab === 'manpower' && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HardHat className="h-5 w-5 text-orange-500" /> Manpower & Trade Group Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Total Site Headcount</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{report.workersOnSite} Workers</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Subcontractor Labour</span>
                <p className="text-2xl font-bold text-[#0B5FFF]">28 Subcontractors</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Direct Personnel</span>
                <p className="text-2xl font-bold text-purple-600">14 Direct Staff</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Total Man-Hours Logged</span>
                <p className="text-2xl font-bold text-emerald-600">{(report.workersOnSite * 8.5).toFixed(0)} Hours</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Trade Group</th>
                    <th className="px-4 py-3">Headcount</th>
                    <th className="px-4 py-3">Standard Shift Hours</th>
                    <th className="px-4 py-3 text-right">Total Man-Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {[
                    { trade: 'Formwork & Rebar Carpenters', count: 12, hours: 8.5 },
                    { trade: 'Heavy Machinery & Crane Operators', count: 8, hours: 9.0 },
                    { trade: 'Concrete Pouring Technicians', count: 10, hours: 8.0 },
                    { trade: 'Site Engineers & Supervisors', count: 6, hours: 8.5 },
                    { trade: 'HSE & Safety Officers', count: 4, hours: 8.0 },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.trade}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{row.count} Workers</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{row.hours} hrs/shift</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0B5FFF]">{(row.count * row.hours).toFixed(1)} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: EQUIPMENT & MATERIALS */}
      {activeTab === 'equipment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" /> Operational Machinery Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Equipment</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {dayEquipment.map(eq => (
                      <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{eq.name} ({eq.licensePlate || eq.id})</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{eq.type}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="success" className="text-[10px]">Operating</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" /> Site Material Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Material Name</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3 text-right">Received By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {dayMaterialDeliveries.map(del => (
                      <tr key={del.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{del.materialId}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{del.quantity} units</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500">{del.receivedBy}</td>
                      </tr>
                    ))}

                    {dayMaterialDeliveries.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500 text-xs">
                          No major material deliveries recorded for this report date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: SAFETY & INSPECTION */}
      {activeTab === 'safety' && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" /> Safety & Inspection Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Incident ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {daySafetyIncidents.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-red-600">{inc.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{inc.title}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{inc.type}</td>
                      <td className="px-4 py-3">
                        <Badge variant="danger" className="text-[10px]">{inc.priority}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-[10px]">{inc.status}</Badge>
                      </td>
                    </tr>
                  ))}

                  {daySafetyIncidents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                        Zero safety incidents recorded for this report date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL: EDIT REPORT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Daily Site Log Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editForm.id} - {editForm.date}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditReportSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weather Condition</label>
                  <CustomSelect
                    value={editForm.weather}
                    onChange={val => setEditForm({ ...editForm, weather: val })}
                    options={['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Heavy Rain', 'High Winds']}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    customPlaceholder="Enter custom weather..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Temperature</label>
                  <input
                    type="text"
                    placeholder="e.g. 26°C"
                    value={editForm.temperature || ''}
                    onChange={e => setEditForm({ ...editForm, temperature: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Workers on Site</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.workersOnSite}
                    onChange={e => setEditForm({ ...editForm, workersOnSite: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Running</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.equipmentRunning}
                    onChange={e => setEditForm({ ...editForm, equipmentRunning: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Safety Incidents</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.incidents}
                    onChange={e => setEditForm({ ...editForm, incidents: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Site Ground Conditions</label>
                <input
                  type="text"
                  placeholder="e.g. Dry, clear access roads"
                  value={editForm.siteConditions || ''}
                  onChange={e => setEditForm({ ...editForm, siteConditions: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Significant Site Events</label>
                <textarea
                  rows={2}
                  value={editForm.significantEvents || ''}
                  onChange={e => setEditForm({ ...editForm, significantEvents: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Report</button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
