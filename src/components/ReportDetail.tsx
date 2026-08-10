import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, CustomSelect } from './ui';
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
  Package
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { DailyReport, Activity, LabourLog, SafetyIncident, Equipment, MaterialReceipt } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportDetailProps {
  report: DailyReport;
  onSave: (updatedReport: DailyReport) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function ReportDetail({ report, onSave, onClose, onDelete }: ReportDetailProps) {
  const { activities, labourLogs, safetyIncidents, equipment, materialReceipts, projects } = useAppContext();

  // Active Tab: 'overview' | 'activities' | 'manpower' | 'equipment' | 'safety'
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'manpower' | 'equipment' | 'safety'>('overview');

  // Edit Report Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<DailyReport>({ ...report });

  // Supervisor Notes State
  const [supervisorNotes, setSupervisorNotes] = useState(report.supervisorNotes || '');

  // Weather Icon Helper
  const getWeatherIcon = (weather: string) => {
    if (weather.toLowerCase().includes('rain')) return <CloudRain className="h-6 w-6 text-blue-500" />;
    if (weather.toLowerCase().includes('cloud')) return <Cloud className="h-6 w-6 text-slate-500" />;
    return <Sun className="h-6 w-6 text-yellow-500" />;
  };

  // Filter activities, labour, safety, equipment, materials relevant to this report date / project
  const dayActivities = activities.filter(a => a.status === 'In Progress' || a.status === 'Completed');
  const dayLabourLogs = labourLogs.filter(l => l.date === report.date || l.projectId === report.projectId);
  const daySafetyIncidents = safetyIncidents.filter(s => s.dateReported === report.date || s.projectId === report.projectId);
  const dayEquipment = equipment.filter(e => e.status === 'Operating');
  const dayMaterialDeliveries = (materialReceipts || []).filter(m => m.receivedDate === report.date);

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
    const doc = new jsPDF();
    const dateStr = report.date;
    
    // Title & Header
    doc.setFontSize(22);
    doc.setTextColor(11, 95, 255);
    doc.text(`Daily Site Report - ${report.id}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${dateStr} | Project: ${report.projectId} | Weather: ${report.weather}, ${report.temperature}`, 14, 28);
    
    // Overview Metrics
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Key Site Metrics', 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Workers on Site', 'Equipment Running', 'Safety Incidents', 'NCRs', 'Site Conditions']],
      body: [[
        `${report.workersOnSite} Personnel`,
        `${report.equipmentRunning} Units`,
        `${report.incidents} Incidents`,
        `${report.ncr} NCRs`,
        report.siteConditions || 'Dry / Clear'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [11, 95, 255] }
    });

    // Activities Table
    let currentY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(13);
    doc.text('Daily Construction Progress', 14, currentY + 15);

    const actData = dayActivities.map(a => [a.id, a.name, a.discipline, a.status, a.progress + '%']);
    autoTable(doc, {
      startY: currentY + 20,
      head: [['ID', 'Activity', 'Discipline', 'Status', 'Progress']],
      body: actData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    // Safety Table
    currentY = (doc as any).lastAutoTable.finalY || currentY + 20;
    doc.setFontSize(13);
    doc.text('Safety & Compliance Summary', 14, currentY + 15);

    const safetyData = daySafetyIncidents.map(s => [s.id, s.title, s.type, s.priority, s.status]);
    autoTable(doc, {
      startY: currentY + 20,
      head: [['Incident ID', 'Title', 'Type', 'Priority', 'Status']],
      body: safetyData.length > 0 ? safetyData : [['N/A', 'Zero active safety incidents reported today', 'N/A', 'N/A', 'Clear']],
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }
    });

    doc.save(`Daily-Site-Report-${report.id}-${dateStr}.pdf`);
  };

  const handlePrint = () => {
    window.print();
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
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{act.assignedTeam || 'Unassigned'}</td>
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
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{eq.name} ({eq.code})</td>
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
