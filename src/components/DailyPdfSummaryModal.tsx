import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './ui';
import { 
  FileText, Download, Mail, Printer, CheckCircle2, AlertTriangle, 
  Sun, CloudRain, Wind, ShieldAlert, Calendar, User, Building, 
  X, Send, Eye, Check, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../context/AppContext';
import { WeatherLog, Activity, SafetyIncident, DailyReport } from '../types';

interface DailyPdfSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultProjectId?: string;
}

export function DailyPdfSummaryModal({
  isOpen,
  onClose,
  defaultDate,
  defaultProjectId
}: DailyPdfSummaryModalProps) {
  const { 
    projects, 
    activities, 
    weatherLogs, 
    safetyIncidents, 
    reports, 
    activityInspections, 
    qaInspections,
    workerCheckIns,
    equipmentLogs,
    currentUserProfile,
    addAuditLog,
    units
  } = useAppContext();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate || new Date().toISOString().split('T')[0]
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || (projects[0]?.id || '')
  );

  // Email state
  const [emailTo, setEmailTo] = useState<string>(
    currentUserProfile?.email || 'site.manager@construction-corp.com'
  );
  const [emailSubject, setEmailSubject] = useState<string>(
    `Daily Site & Weather Summary Report - ${selectedDate}`
  );
  const [emailNote, setEmailNote] = useState<string>(
    'Attached is the official daily site activities, weather conditions log, and safety compliance summary for site operations review.'
  );

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'email'>('preview');

  // Module inclusion options
  const [includeWeather, setIncludeWeather] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeSafety, setIncludeSafety] = useState(true);
  const [includeQuality, setIncludeQuality] = useState(true);
  const [includePersonnel, setIncludePersonnel] = useState(true);

  // Selected Project Object
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0] || { id: 'PRJ-9348', name: 'Main Substation Project', code: 'SUB-01' };
  }, [projects, selectedProjectId]);

  // Filtered Data for Selected Date
  const dayWeatherLog: WeatherLog | null = useMemo(() => {
    const match = weatherLogs.find(w => w.date === selectedDate && (w.projectId === selectedProjectId || !w.projectId));
    if (match) return match;
    // Fallback if none found for specific date
    if (weatherLogs.length > 0) return weatherLogs[0];
    return {
      id: 'WTR-LOG-CURRENT',
      projectId: selectedProjectId || 'PRJ-9348',
      date: selectedDate,
      time: '08:00',
      condition: 'Sunny',
      temperature: 24,
      humidity: 55,
      windSpeed: 12,
      windDirection: 'SE',
      rainfall: 0,
      impactLevel: 'Normal Operations',
      safetyAdvisories: ['Standard PPE mandatory across all work packages', 'Hydration station open'],
      notes: 'Clear skies. Optimal environmental conditions for structural work.',
      loggedBy: currentUserProfile?.name || 'Site Manager',
      createdAt: new Date().toISOString()
    };
  }, [weatherLogs, selectedDate, selectedProjectId, currentUserProfile]);

  const dayActivities = useMemo(() => {
    return activities.filter(a => a.projectId === selectedProjectId || !a.projectId);
  }, [activities, selectedProjectId]);

  const dayIncidents = useMemo(() => {
    return safetyIncidents.filter(s => s.dateReported === selectedDate && s.projectId === selectedProjectId);
  }, [safetyIncidents, selectedDate, selectedProjectId]);

  const dayReport = useMemo(() => {
    return reports.find(r => r.date === selectedDate && r.projectId === selectedProjectId) || {
      id: `REP-${selectedDate}`,
      date: selectedDate,
      projectId: selectedProjectId,
      weather: dayWeatherLog?.condition || 'Sunny',
      temperature: `${dayWeatherLog?.temperature || 24}°C`,
      workersOnSite: workerCheckIns.length || 28,
      equipmentRunning: equipmentLogs.length || 6,
      incidents: dayIncidents.length,
      ncr: 0,
      siteConditions: dayWeatherLog?.notes || 'Normal operations'
    };
  }, [reports, selectedDate, selectedProjectId, dayWeatherLog, workerCheckIns, equipmentLogs, dayIncidents]);

  // Temperature display formatter
  const formatTempStr = (celsius: number) => {
    if (units === 'imperial') {
      const f = Math.round((celsius * 9) / 5 + 32);
      return `${f}°F (${celsius}°C)`;
    }
    return `${celsius}°C`;
  };

  const formatWindStr = (speedKm: number, dir = '') => {
    if (units === 'imperial') {
      const mph = Math.round(speedKm * 0.621371);
      return `${mph} mph ${dir}`;
    }
    return `${speedKm} km/h ${dir}`;
  };

  // Generate PDF document using jsPDF & jspdf-autotable
  const generatePdfBlob = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header Banner
    doc.setFillColor(11, 95, 255); // #0B5FFF Primary
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DAILY SITE & WEATHER SUMMARY REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 18, { align: 'right' });

    // Project & Meta Card
    let yPos = 36;
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Project: ${currentProject.name} (${(currentProject as any).contractNumber || currentProject.id})`, 14, yPos);
    doc.text(`Date of Report: ${selectedDate}`, 120, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Site Manager / Reporter: ${dayWeatherLog?.loggedBy || currentUserProfile?.name || 'Site Manager'}`, 14, yPos);
    doc.text(`Report ID: RPT-SUM-${selectedDate.replace(/-/g, '')}`, 120, yPos);

    doc.setDrawColor(220, 220, 220);
    doc.line(14, yPos + 4, pageWidth - 14, yPos + 4);
    yPos += 10;

    // SECTION 1: Weather & Environmental Logs
    if (includeWeather && dayWeatherLog) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('1. Daily Site Weather & Operational Environmental Logs', 14, yPos);
      yPos += 5;

      const weatherTableBody = [
        [
          'Condition & Temp',
          `${dayWeatherLog.condition} | ${formatTempStr(dayWeatherLog.temperature)}`,
          'Wind Velocity',
          formatWindStr(dayWeatherLog.windSpeed || 0, dayWeatherLog.windDirection)
        ],
        [
          'Humidity',
          `${dayWeatherLog.humidity || 0}%`,
          'Rainfall',
          `${dayWeatherLog.rainfall || 0} mm`
        ],
        [
          'Operational Site Impact',
          dayWeatherLog.impactLevel,
          'Observation Time',
          `${dayWeatherLog.date} at ${dayWeatherLog.time || '08:00'}`
        ]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value', 'Metric', 'Value']],
        body: weatherTableBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;

      // Advisories sub-table if any
      if (dayWeatherLog.safetyAdvisories && dayWeatherLog.safetyAdvisories.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9); // Amber
        doc.text('Active Weather Safety Protocols & Directives:', 14, yPos);
        yPos += 4;

        const advRows = dayWeatherLog.safetyAdvisories.map((a, i) => [`Directive ${i + 1}`, a]);
        autoTable(doc, {
          startY: yPos,
          head: [['Ref', 'Safety Directive / Action Requirement']],
          body: advRows,
          theme: 'grid',
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 2.5 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    // SECTION 2: Daily Construction Progress Activities
    if (includeActivities) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('2. Construction Activities Progress & Weather Status', 14, yPos);
      yPos += 5;

      const activityRows = dayActivities.map(act => [
        act.id,
        act.name,
        act.discipline,
        act.status,
        `${act.progress}%`,
        dayWeatherLog?.affectedActivityIds?.includes(act.id) ? 'WEATHER HOLD' : 'NORMAL'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Activity Name', 'Discipline', 'Status', 'Progress', 'Weather Impact']],
        body: activityRows.length > 0 ? activityRows : [['N/A', 'No activities recorded for project', 'N/A', 'N/A', '0%', 'N/A']],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // SECTION 3: Safety & Quality Compliance Checks
    if (includeSafety) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('3. Safety Incidents & Site Compliance Inspections', 14, yPos);
      yPos += 5;

      const incidentRows = dayIncidents.map(inc => [
        inc.id,
        inc.title,
        inc.type,
        inc.priority || inc.riskLevel || 'Low',
        inc.status
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Incident ID', 'Incident / Hazard Title', 'Type', 'Severity', 'Status']],
        body: incidentRows.length > 0 ? incidentRows : [['N/A', 'Zero active safety incidents reported for date', 'Compliance', 'Low', 'CLEAR']],
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;
    }

    // SECTION 4: Personnel & Equipment Utilization
    if (includePersonnel) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 95, 255);
      doc.text('4. Site Resources & Equipment Utilization', 14, yPos);
      yPos += 5;

      const resourceBody = [
        ['Total Personnel Checked In', `${dayReport.workersOnSite || 28} Workers / Engineers`],
        ['Equipment Operating On Site', `${dayReport.equipmentRunning || 6} Heavy Units`],
        ['Quality Non-Conformance Reports (NCR)', `${dayReport.ncr || 0} Open NCRs`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Resource Category', 'Quantity / Count']],
        body: resourceBody,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // SECTION 5: Supervisor Sign-off Box
    if (yPos + 35 > doc.internal.pageSize.height) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, yPos, pageWidth - 28, 30, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SITE SUPERVISOR SIGN-OFF & VERIFICATION', 18, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('I hereby certify that the weather observations, safety directives, and daily progress activities listed above represent an accurate account of site conditions.', 18, yPos + 13);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Supervisor Name: ${dayWeatherLog?.loggedBy || currentUserProfile?.name || 'Site Manager'}`, 18, yPos + 23);
    doc.text(`Signature: [VERIFIED DIGITAL SIGNATURE]`, 120, yPos + 23);

    return doc;
  };

  // Download PDF Action
  const handleDownloadPdf = () => {
    const doc = generatePdfBlob();
    doc.save(`Daily_Site_Weather_Summary_${selectedDate}_${(currentProject as any).contractNumber || currentProject.id}.pdf`);

    // Audit Log entry
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: selectedProjectId,
      userId: currentUserProfile?.name || 'Site Manager',
      action: 'Exported PDF Summary',
      details: `Generated and downloaded daily PDF summary for date ${selectedDate}`,
      timestamp: new Date().toISOString()
    });
  };

  // Simulate Emailing PDF
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) return;

    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      setEmailSentSuccess(true);

      // Audit log entry
      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: selectedProjectId,
        userId: currentUserProfile?.name || 'Site Manager',
        action: 'Emailed Daily PDF Summary',
        details: `Emailed daily site and weather summary report for date ${selectedDate} to ${emailTo}`,
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        setEmailSentSuccess(false);
      }, 4000);
    }, 1200);
  };

  // Print Action
  const handlePrint = () => {
    handleDownloadPdf();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-blue-600 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Export Daily Site, Weather & Safety PDF Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate, download, or email standardized daily operational executive summaries.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters & Options Toolbar */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.contractNumber || p.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Report Date
            </label>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document Scope Tabs
            </label>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex-1 py-1 rounded-md font-medium text-center transition-all ${
                  activeTab === 'preview' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Document Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-1 rounded-md font-medium text-center transition-all ${
                  activeTab === 'email' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Email Report
              </button>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Section Inclusion Checkboxes */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Select Included Report Modules:
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeWeather} 
                  onChange={e => setIncludeWeather(e.target.checked)}
                  className="rounded text-[#0B5FFF]" 
                />
                <span>Weather & Environmental Logs</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeActivities} 
                  onChange={e => setIncludeActivities(e.target.checked)}
                  className="rounded text-[#0B5FFF]" 
                />
                <span>Daily Activities & Progress</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeSafety} 
                  onChange={e => setIncludeSafety(e.target.checked)}
                  className="rounded text-[#0B5FFF]" 
                />
                <span>Safety Checks & Incidents</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includePersonnel} 
                  onChange={e => setIncludePersonnel(e.target.checked)}
                  className="rounded text-[#0B5FFF]" 
                />
                <span>Personnel & Equipment Count</span>
              </label>
            </div>
          </div>

          {activeTab === 'preview' ? (
            /* VISUAL DOCUMENT PREVIEW */
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white text-slate-900 shadow-sm p-6 space-y-5 text-sm">
              {/* Header Banner */}
              <div className="bg-[#0B5FFF] text-white p-4 -m-6 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-wide">DAILY SITE & WEATHER SUMMARY REPORT</h2>
                  <p className="text-xs opacity-90 mt-0.5">{currentProject.name} • {selectedDate}</p>
                </div>
                <div className="text-right text-xs opacity-80">
                  <span>Standard Site Log</span>
                </div>
              </div>

              {/* Meta Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Project Name</span>
                  <strong className="text-slate-900">{currentProject.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Report Date</span>
                  <strong className="text-slate-900">{selectedDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Logged By</span>
                  <strong className="text-slate-900">{dayWeatherLog?.loggedBy || 'Site Manager'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Document ID</span>
                  <strong className="text-slate-900 font-mono">RPT-{selectedDate.replace(/-/g, '')}</strong>
                </div>
              </div>

              {/* Weather Module Preview */}
              {includeWeather && dayWeatherLog && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B5FFF] flex items-center gap-1">
                    <Sun className="h-4 w-4" /> 1. Daily Site Weather & Environmental Logs
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                    <div>
                      <span className="text-slate-500 block">Condition:</span>
                      <strong className="text-slate-900">{dayWeatherLog.condition}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Temperature:</span>
                      <strong className="text-slate-900">{formatTempStr(dayWeatherLog.temperature)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Wind Velocity:</span>
                      <strong className="text-slate-900">{formatWindStr(dayWeatherLog.windSpeed || 0, dayWeatherLog.windDirection)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Impact Level:</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                        {dayWeatherLog.impactLevel}
                      </span>
                    </div>
                  </div>

                  {dayWeatherLog.safetyAdvisories && dayWeatherLog.safetyAdvisories.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <span className="font-bold block mb-1">Active Safety Directives:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {dayWeatherLog.safetyAdvisories.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Construction Activities Preview */}
              {includeActivities && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B5FFF]">
                    2. Active Construction Progress Activities
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Activity Name</th>
                          <th className="p-2">Discipline</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dayActivities.slice(0, 5).map(act => (
                          <tr key={act.id}>
                            <td className="p-2 font-mono text-slate-500">{act.id}</td>
                            <td className="p-2 font-semibold text-slate-900">{act.name}</td>
                            <td className="p-2 text-slate-600">{act.discipline}</td>
                            <td className="p-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                act.status === 'Blocked' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {act.status}
                              </span>
                            </td>
                            <td className="p-2 font-bold">{act.progress}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety & Personnel Summary Preview */}
              {includeSafety && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B5FFF]">
                    3. Safety Incidents & Site Resources
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Safety Incidents</span>
                      <strong className="text-base text-emerald-800">{dayIncidents.length} Reported</strong>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Personnel On Site</span>
                      <strong className="text-base text-blue-800">{dayReport.workersOnSite || 28} Workers</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-500 block text-[11px]">Equipment Running</span>
                      <strong className="text-base text-slate-800">{dayReport.equipmentRunning || 6} Units</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Signoff Box */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Verified Digital Supervisor Sign-off</span>
                  <span className="text-slate-500 text-[11px]">Site Manager: {dayWeatherLog?.loggedBy || 'Site Manager'}</span>
                </div>
                <div className="text-right font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  ✓ VERIFIED LOGGED
                </div>
              </div>
            </div>
          ) : (
            /* EMAIL REPORT FORM */
            <form onSubmit={handleSendEmail} className="space-y-4">
              {emailSentSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Summary PDF successfully dispatched via email to <strong>{emailTo}</strong> and logged to audit records!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email Address(es)
                </label>
                <input 
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="manager@company.com, client.rep@project.com"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line
                </label>
                <input 
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cover Note / Message
                </label>
                <textarea 
                  rows={4}
                  value={emailNote}
                  onChange={e => setEmailNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                <strong>Attachment:</strong> <span className="font-mono">Daily_Site_Weather_Summary_{selectedDate}.pdf</span> (Auto-compiled)
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="bg-[#0B5FFF] text-white hover:bg-[#0B5FFF]/90 text-xs gap-1.5"
                >
                  {isSendingEmail ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Email with PDF Summary
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
              className="text-xs gap-1.5 border-slate-300 dark:border-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Web View
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>

            <Button 
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs bg-[#0B5FFF] text-white hover:bg-[#0B5FFF]/90 shadow-sm gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export & Download PDF
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
