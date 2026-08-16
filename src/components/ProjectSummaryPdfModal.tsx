import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './ui';
import { 
  FileText, Download, Printer, CheckCircle2, AlertTriangle, 
  Building, Calendar, User, ShieldAlert, Truck, Users, Clock, 
  X, Check, Layers, BarChart3, HardHat, FileCheck, FileSpreadsheet
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../context/AppContext';
import { Project } from '../types';
import { exportFullProjectCSV } from '../lib/csvExport';

interface ProjectSummaryPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export function ProjectSummaryPdfModal({
  isOpen,
  onClose,
  defaultProjectId
}: ProjectSummaryPdfModalProps) {
  const { 
    projects, 
    activities, 
    reports, 
    labourLogs, 
    safetyIncidents, 
    equipment, 
    materials, 
    qaInspections,
    currentUserProfile,
    addAuditLog
  } = useAppContext();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (projects[0]?.id || '')
  );

  // Sections toggle
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeLabour, setIncludeLabour] = useState(true);
  const [includeEquipment, setIncludeEquipment] = useState(true);
  const [includeSafetyQuality, setIncludeSafetyQuality] = useState(true);

  const selectedProject: Project = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || {
      id: 'PRJ-DEFAULT',
      name: 'Constructfield Main Site',
      client: 'Infrastructure Dev Corp',
      contractNumber: 'CN-001',
      contractValue: 1000000,
      engineer: 'Lead Site Engineer',
      startDate: '2025-01-01',
      finishDate: '2026-12-31',
      status: 'In Progress',
      progress: 65,
      location: 'Site Location A'
    };
  }, [projects, selectedProjectId]);

  // Derived Analytics for Selected Project
  const projActivities = useMemo(() => activities.filter(a => a.projectId === selectedProject.id), [activities, selectedProject]);
  const projLabourLogs = useMemo(() => labourLogs.filter(l => l.projectId === selectedProject.id), [labourLogs, selectedProject]);
  const projReports = useMemo(() => reports.filter(r => r.projectId === selectedProject.id), [reports, selectedProject]);
  const projIncidents = useMemo(() => safetyIncidents.filter(s => s.projectId === selectedProject.id), [safetyIncidents, selectedProject]);
  const projQA = useMemo(() => qaInspections.filter(q => q.projectId === selectedProject.id), [qaInspections, selectedProject]);

  const calcProgress = projActivities.length > 0
    ? Math.round(projActivities.reduce((acc, a) => acc + a.progress, 0) / projActivities.length)
    : selectedProject.progress || 0;

  const totalHours = projLabourLogs.reduce((acc, l) => acc + l.hours, 0);
  const completedActivitiesCount = projActivities.filter(a => a.status === 'Completed').length;
  const inProgressActivitiesCount = projActivities.filter(a => a.status === 'In Progress').length;
  const openIncidentsCount = projIncidents.filter(s => s.status !== 'Resolved' && s.status !== 'Closed').length;

  if (!isOpen) return null;

  // Handle JS PDF Generation
  const handleGenerateJsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 18;

    // Header Title
    doc.setFillColor(11, 95, 255); // #0B5FFF
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTRUCTFIELD - OFFICIAL EXECUTIVE PROJECT SUMMARY REPORT', 14, 8);

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(selectedProject.name, 14, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Project Code: ${selectedProject.id} | Generated: ${new Date().toLocaleDateString()} | Author: ${currentUserProfile?.name || 'Site Admin'}`, 14, yPos);
    yPos += 8;

    // SECTION 1: Executive Overview Table
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 95, 255);
    doc.text('1. Project Contract Specifications & Key Performance Metrics', 14, yPos);
    yPos += 4;

    const metaTable = [
      ['Client / Principal', selectedProject.client || 'N/A', 'Lead Engineer', selectedProject.engineer || 'N/A'],
      ['Start Date', selectedProject.startDate || 'N/A', 'Target Finish Date', selectedProject.finishDate || 'N/A'],
      ['Status', selectedProject.status, 'Site Location', selectedProject.location || 'N/A'],
      ['Overall Progress', `${calcProgress}% (${completedActivitiesCount}/${projActivities.length} Tasks Complete)`, 'Total Labour Hours', `${totalHours} Hours Logged`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: metaTable,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // SECTION 2: Activities Breakdown
    if (includeActivities && projActivities.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('2. Work Package & Construction Activities Progress', 14, yPos);
      yPos += 4;

      const actRows = projActivities.map(a => [
        a.id,
        a.name,
        a.discipline || 'General',
        a.status,
        `${a.progress}%`,
        a.assignedTo || 'Unassigned'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Activity Name', 'Discipline', 'Status', 'Progress', 'Assigned To']],
        body: actRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // SECTION 3: Labour & Workforce Allocation
    if (includeLabour) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('3. Workforce & Trade Hours Logged', 14, yPos);
      yPos += 4;

      const activeTradesList = Array.from(new Set(projLabourLogs.map(l => l.workerType).filter(Boolean))).join(', ') || 'None recorded';

      const labourBody = [
        ['Total Cumulative Labour Hours', `${totalHours} Hours`],
        ['Submitted Daily Reports', `${projReports.length} Reports`],
        ['Active Site Trades', activeTradesList]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Workforce Metric', 'Recorded Value']],
        body: labourBody,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // SECTION 4: HSE Safety & Quality
    if (includeSafetyQuality) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('4. HSE Safety Compliance & Quality Inspection Summary', 14, yPos);
      yPos += 4;

      const incidentRows = projIncidents.map(inc => [
        inc.id,
        inc.title,
        inc.priority || inc.riskLevel || 'Medium',
        inc.status
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Ref ID', 'Safety Incident / Hazard', 'Severity', 'Status']],
        body: incidentRows.length > 0 ? incidentRows : [['N/A', 'Zero active HSE incidents recorded for project', 'Clear', 'Compliant']],
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // Signature Block
    if (yPos + 30 > doc.internal.pageSize.height) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, yPos, pageWidth - 28, 26, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE CERTIFICATION & SIGN-OFF', 18, yPos + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('I confirm that this project summary report accurately reflects site progress, safety compliance logs, and physical achievements.', 18, yPos + 12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Project Manager: ${selectedProject.engineer || currentUserProfile?.name || 'Lead Admin'}`, 18, yPos + 20);
    doc.text(`Digital Seal: [VERIFIED CONSTRUCTFIELD SEAL]`, 120, yPos + 20);

    doc.save(`${selectedProject.name.replace(/\s+/g, '_')}_Summary_Report.pdf`);

    addAuditLog({
      id: `AUD-${Date.now()}`,
      projectId: selectedProject.id,
      userId: currentUserProfile?.id || 'admin',
      userRole: currentUserProfile?.role || 'Admin',
      action: 'EXPORT',
      details: `Exported executive PDF summary report for project "${selectedProject.name}"`,
      timestamp: new Date().toISOString(),
      entityType: 'Project',
      entityId: selectedProject.id
    });
  };

  const handleNativePrint = () => {
    handleGenerateJsPDF();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#0B5FFF] text-white shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export Project Summary Report</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate clean PDF reports or print using native CSS styles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Target Project
              </label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Report Scope Sections
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={includeActivities} onChange={e => setIncludeActivities(e.target.checked)} className="rounded text-[#0B5FFF]" />
                  <span>Activities</span>
                </label>
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={includeLabour} onChange={e => setIncludeLabour(e.target.checked)} className="rounded text-[#0B5FFF]" />
                  <span>Labour</span>
                </label>
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" checked={includeSafetyQuality} onChange={e => setIncludeSafetyQuality(e.target.checked)} className="rounded text-[#0B5FFF]" />
                  <span>HSE & Quality</span>
                </label>
              </div>
            </div>
          </div>

          {/* Printable Report Preview Canvas */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-white text-slate-900 shadow-sm space-y-6 printable-report-preview">
            
            {/* Header / Letterhead */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B5FFF] uppercase tracking-wider mb-1">
                  <Building className="h-4 w-4" /> Constructfield Enterprise Report
                </div>
                <h2 className="text-2xl font-black text-slate-900">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500">Project Code: {selectedProject.id} | Location: {selectedProject.location || 'Site Alpha'}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#0B5FFF] text-xs font-extrabold uppercase">
                  {selectedProject.status}
                </span>
                <p className="text-xs text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Key Performance Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progress</span>
                <span className="text-lg font-black text-[#0B5FFF]">{calcProgress}%</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Tasks</span>
                <span className="text-lg font-black text-slate-800">{completedActivitiesCount} / {projActivities.length}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Labour Hours</span>
                <span className="text-lg font-black text-emerald-600">{totalHours} hrs</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Open HSE Hazards</span>
                <span className={`text-lg font-black ${openIncidentsCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {openIncidentsCount}
                </span>
              </div>
            </div>

            {/* Section 1: Specifications */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-1 mb-2 border-slate-200">
                1. Contract & Location Specifications
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div><strong>Client:</strong> {selectedProject.client || 'N/A'}</div>
                <div><strong>Lead Engineer:</strong> {selectedProject.engineer || 'N/A'}</div>
                <div><strong>Start Date:</strong> {selectedProject.startDate || 'N/A'}</div>
                <div><strong>Target Completion:</strong> {selectedProject.finishDate || 'N/A'}</div>
              </div>
            </div>

            {/* Section 2: Construction Progress */}
            {includeActivities && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-1 mb-2 border-slate-200">
                  2. Construction Activities Breakdown
                </h4>
                {projActivities.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">Activity Name</th>
                        <th className="p-2 border">Discipline</th>
                        <th className="p-2 border">Status</th>
                        <th className="p-2 border">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projActivities.slice(0, 8).map(act => (
                        <tr key={act.id} className="border-b">
                          <td className="p-2 font-mono">{act.id}</td>
                          <td className="p-2 font-medium">{act.name}</td>
                          <td className="p-2">{act.discipline}</td>
                          <td className="p-2">{act.status}</td>
                          <td className="p-2 font-bold text-[#0B5FFF]">{act.progress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific activities logged for this project yet.</p>
                )}
              </div>
            )}

            {/* Section 3: HSE & Compliance */}
            {includeSafetyQuality && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b pb-1 mb-2 border-slate-200">
                  3. Health, Safety & Environmental Compliance
                </h4>
                <div className="text-xs text-slate-700 space-y-1">
                  <p>• <strong>Logged Incidents / Hazards:</strong> {projIncidents.length} total recorded</p>
                  <p>• <strong>Open Non-Conformance Reports:</strong> {projQA.filter(q => q.status === 'Failed' || q.ncrDetails?.status === 'Open').length} NCRs</p>
                  <p>• <strong>Site Safety Status:</strong> {openIncidentsCount === 0 ? 'Compliant - Zero open hazards' : 'Attention Required'}</p>
                </div>
              </div>
            )}

            {/* Sign off Box */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Verified By:</p>
                <p>{currentUserProfile?.name || 'Lead Administrator'}</p>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-400">
                Constructfield Certified Digital Report
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 dark:border-slate-700">
            Cancel
          </Button>
          <Button
            onClick={() => exportFullProjectCSV(activities, reports, projects, selectedProjectId)}
            variant="outline"
            className="gap-2 rounded-xl border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold"
            title="Download offline CSV copy of project activities and site logs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Download CSV
          </Button>
          <Button
            onClick={handleNativePrint}
            variant="outline"
            className="gap-2 rounded-xl border-slate-300 dark:border-slate-700 font-semibold"
          >
            <Printer className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            Print / Browser PDF
          </Button>
          <Button
            onClick={handleGenerateJsPDF}
            className="gap-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

      </div>
    </div>
  );
}
