import React, { useState, useRef } from 'react';
import { Activity, DailyReport, ActivityStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { CameraCapture } from './CameraCapture';
import { saveOrShareFile } from '../lib/fileExportService';
import {
  Mic,
  Square,
  Loader2,
  Sparkles,
  FileBarChart,
  CheckCircle2,
  Download,
  Printer,
  RefreshCw,
  X,
  Calendar,
  TrendingUp,
  Users,
  Wrench,
  ShieldAlert,
  FileText,
  Sun,
  Layers,
  MapPin,
  UserCheck,
  Package,
  Clock,
  ArrowRight,
  Camera,
  Trash2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordActivityForTaskModalProps {
  activity: Activity;
  onClose: () => void;
  onActivityUpdated?: (updatedActivity: Activity) => void;
}

export function RecordActivityForTaskModal({ activity, onClose, onActivityUpdated }: RecordActivityForTaskModalProps) {
  const { addReport, updateActivity, addAuditLog, labourLogs } = useAppContext();
  
  const calculatedActualHours = React.useMemo(() => {
    if (!labourLogs) return activity.actualHours || 0;
    return labourLogs
      .filter(log => log?.activityId === activity.id)
      .reduce((sum, log) => sum + (log.hours || 0), 0);
  }, [labourLogs, activity.id, activity.actualHours]);

  const [step, setStep] = useState<'edit' | 'success'>('edit');

  // Camera & Site Photos State
  const [reportPhotos, setReportPhotos] = useState<string[]>(activity.photos || []);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // Activity State Inputs
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [progressVal, setProgressVal] = useState<number>(activity.progress || 0);
  const [actualQtyVal, setActualQtyVal] = useState<number>(activity.actualQuantity || 0);
  const [statusVal, setStatusVal] = useState<ActivityStatus>(activity.status || 'In Progress');
  
  // Site Condition Inputs
  const [weatherVal, setWeatherVal] = useState<string>('Sunny');
  const [tempVal, setTempVal] = useState<string>('24°C');
  const [siteConditions, setSiteConditions] = useState<string>('Site dry and fully accessible');
  const [workersCount, setWorkersCount] = useState<number>(
    activity.assignedLabour && activity.assignedLabour.length > 0 ? activity.assignedLabour.length : 8
  );
  const [equipmentCount, setEquipmentCount] = useState<number>(
    activity.assignedEquipment && activity.assignedEquipment.length > 0 ? activity.assignedEquipment.length : 2
  );
  const [incidentsCount, setIncidentsCount] = useState<number>(0);
  const [ncrCount, setNcrCount] = useState<number>(0);

  // Field Notes & Dictation
  const [notesInput, setNotesInput] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Audio Recording Ref
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Generated Report Reference for PDF & Success View
  const [createdReport, setCreatedReport] = useState<DailyReport | null>(null);

  // Audio Recording Handlers
  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported on this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      setIsRecording(false);
      setMicError(err?.message?.includes('denied') || err?.name === 'NotAllowedError'
        ? "Microphone access was denied. Please allow microphone permissions in your browser or enter observations manually below."
        : "Could not access microphone. You can type your observations directly into the field notes box.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        setIsRecording(false);
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        await processVoiceNote(audioBlob);
      };
      mediaRecorderRef.current.stop();
    }
  };

  const processVoiceNote = async (blob: Blob) => {
    setIsVoiceProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        const response = await fetch('/api/generate-report-from-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64data,
            mimeType: blob.type,
            projectId: activity.projectId
          }),
        });

        if (!response.ok) throw new Error('Failed to process voice note');

        const result = await response.json();

        if (result.supervisorNotes) {
          setNotesInput(prev => prev ? `${prev}\n[Voice Dictation]: ${result.supervisorNotes}` : result.supervisorNotes);
        }
        if (result.weather) setWeatherVal(result.weather);
        if (result.temperature) setTempVal(result.temperature);
        if (result.workersOnSite) setWorkersCount(Number(result.workersOnSite));
        if (result.equipmentRunning) setEquipmentCount(Number(result.equipmentRunning));
        if (result.incidents) setIncidentsCount(Number(result.incidents));
        if (result.ncr) setNcrCount(Number(result.ncr));
      };
    } catch (err) {
      console.warn("Voice dictation processing:", err);
    } finally {
      setIsVoiceProcessing(false);
    }
  };;

  // Main Handler: Save State of Activity & Post Daily Report
  const handleSaveAndPostReport = () => {
    const todayStr = reportDate || new Date().toISOString().split('T')[0];

    // 1. Calculate and update Activity State
    const updatedRemarks = notesInput.trim()
      ? `${activity.remarks ? activity.remarks + '\n' : ''}[Daily Log ${todayStr}]: ${notesInput.trim()}`
      : activity.remarks;

    const updatedActivity: Activity = {
      ...activity,
      progress: Number(progressVal) || 0,
      actualQuantity: Number(actualQtyVal) || 0,
      actualHours: calculatedActualHours,
      status: statusVal,
      remarks: updatedRemarks,
      photos: reportPhotos,
      updatedAt: todayStr
    };

    // Save Activity State to state & context
    if (onActivityUpdated) {
      onActivityUpdated(updatedActivity);
    } else {
      updateActivity(updatedActivity);
    }

    // 2. Construct Daily Site Report for this activity
    const activityLogSummary = `[${activity.id}] ${activity.name} - ${progressVal}% complete (${actualQtyVal}/${activity.targetQuantity || 0} ${activity.unit || 'units'}, ${calculatedActualHours} hrs logged)`;

    const comprehensiveNotes = [
      `DAILY ACTIVITY RECORD & STATE REPORT`,
      `----------------------------------------`,
      `Activity ID: ${activity.id} | ${activity.name}`,
      `Work Package: ${activity.workPackage} | Area: ${activity.area || 'Main Site'}`,
      `Status: ${statusVal} | Progress: ${progressVal}%`,
      `Quantity Logged: ${actualQtyVal} / ${activity.targetQuantity || 0} ${activity.unit || 'units'}`,
      `Hours Logged Today: ${calculatedActualHours} hrs`,
      activity.assignedLabour?.length ? `Assigned Workers (${activity.assignedLabour.length}): ${activity.assignedLabour.map(l => l.name).join(', ')}` : '',
      activity.assignedEquipment?.length ? `Assigned Equipment (${activity.assignedEquipment.length}): ${activity.assignedEquipment.map(e => e.name).join(', ')}` : '',
      activity.assignedMaterials?.length ? `Assigned Materials (${activity.assignedMaterials.length}): ${activity.assignedMaterials.map(m => `${m.name} (${m.quantity} ${m.unit})`).join(', ')}` : '',
      `\nSupervisor Observations & Notes:\n${notesInput.trim() || 'Activity progress & state recorded successfully.'}`
    ].filter(Boolean).join('\n');

    const newReport: DailyReport = {
      id: `REP-${activity.id}-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      projectId: activity.projectId,
      weather: weatherVal,
      temperature: tempVal,
      siteConditions: siteConditions,
      significantEvents: `Recorded daily activity state for ${activity.name} (${activity.id})`,
      workersOnSite: Number(workersCount) || 0,
      equipmentRunning: Number(equipmentCount) || 0,
      incidents: Number(incidentsCount) || 0,
      ncr: Number(ncrCount) || 0,
      activitiesLogged: [activityLogSummary],
      supervisorNotes: comprehensiveNotes,
      photos: reportPhotos
    };

    // Post to Reports Screen context
    addReport(newReport);

    // Add Audit Log
    addAuditLog({
      id: `AL-${Math.random().toString(36).substr(2, 9)}`,
      projectId: activity.projectId,
      userId: 'Current User',
      action: 'Activity State Saved & Daily Report Posted',
      details: `Saved state for "${activity.name}" (${activity.id}) and generated Daily Report "${newReport.id}".`,
      timestamp: new Date().toISOString()
    });

    setCreatedReport(newReport);
    setStep('success');
  };

  // PDF Generation for Printable Output
  const handleDownloadPDF = () => {
    if (!createdReport) return;

    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(11, 95, 255);
    doc.rect(0, 0, 210, 24, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(`DAILY ACTIVITY STATE REPORT`, 14, 15);

    doc.setFontSize(9);
    doc.text(`Report ID: ${createdReport.id} | Date: ${createdReport.date}`, 130, 15);

    // Activity Title Box
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Activity Details: ${activity.name} (${activity.id})`, 14, 34);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Work Package: ${activity.workPackage} | Area: ${activity.area || 'N/A'} | Status: ${activity.status}`, 14, 41);

    // Progress Table
    autoTable(doc, {
      startY: 48,
      head: [['Metrics', 'Target Qty', 'Actual Qty Logged', 'Progress %', 'Hours Logged']],
      body: [[
        activity.unit || 'Units',
        `${activity.targetQuantity || 0} ${activity.unit || ''}`,
        `${actualQtyVal} ${activity.unit || ''}`,
        `${progressVal}%`,
        `${calculatedActualHours} hrs`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [11, 95, 255], textColor: 255 }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 70;

    // Site Conditions Table
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Site Environment & Resources`, 14, currentY + 12);

    autoTable(doc, {
      startY: currentY + 16,
      head: [['Weather', 'Temperature', 'Workers', 'Equipment Units', 'Safety Incidents', 'NCRs']],
      body: [[
        createdReport.weather,
        createdReport.temperature,
        `${createdReport.workersOnSite} Workers`,
        `${createdReport.equipmentRunning} Units`,
        `${createdReport.incidents} Incidents`,
        `${createdReport.ncr} NCRs`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: 255 }
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 40;

    // Resource Breakdown
    if (activity.assignedLabour?.length || activity.assignedEquipment?.length) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Assigned Task Resources`, 14, currentY + 12);

      const resRows: string[][] = [];
      if (activity.assignedLabour?.length) {
        resRows.push(['Labour/Personnel', activity.assignedLabour.map(l => `${l.name} (${l.role})`).join(', ')]);
      }
      if (activity.assignedEquipment?.length) {
        resRows.push(['Equipment', activity.assignedEquipment.map(e => `${e.name}${e.operator ? ` (Operator: ${e.operator})` : ''}`).join(', ')]);
      }
      if (activity.assignedMaterials?.length) {
        resRows.push(['Materials', activity.assignedMaterials.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(', ')]);
      }

      autoTable(doc, {
        startY: currentY + 16,
        head: [['Resource Type', 'Details & Allocation']],
        body: resRows,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: 255 }
      });

      currentY = (doc as any).lastAutoTable?.finalY || currentY + 30;
    }

    // Supervisor Notes
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Field Observations & Report Notes`, 14, currentY + 12);

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(createdReport.supervisorNotes, 180);
    doc.text(splitNotes, 14, currentY + 18);
    currentY += splitNotes.length * 5 + 20;

    // Photos in PDF
    if (createdReport.photos && createdReport.photos.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Timestamped Site Photos (${createdReport.photos.length})`, 14, currentY);

      currentY += 6;
      let photoX = 14;
      const photoW = 55;
      const photoH = 40;

      createdReport.photos.forEach((photoUrl) => {
        if (photoX + photoW > 195) {
          photoX = 14;
          currentY += photoH + 8;
          if (currentY > 230) {
            doc.addPage();
            currentY = 20;
          }
        }
        try {
          doc.addImage(photoUrl, 'JPEG', photoX, currentY, photoW, photoH);
        } catch (err) {
          console.error("PDF image add failed:", err);
        }
        photoX += photoW + 8;
      });
    }

    const filename = `Activity_Daily_Report_${activity.id}_${createdReport.date}.pdf`;
    const blob = doc.output('blob');
    saveOrShareFile({
      filename,
      blob,
      title: `Activity Report: ${activity.name}`,
      text: `Constructfield Activity Daily Report - ${activity.name}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-slate-200 dark:border-slate-800 my-auto">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 text-white font-bold text-[10px] uppercase">
                Record Activity State
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-500">{activity.id}</span>
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
              {activity.name}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5 text-slate-400" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {step === 'edit' && (
            <div className="flex flex-col gap-6">
              {/* Activity Info Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Layers className="h-4 w-4 text-[#0B5FFF]" />
                  <span>Package: <strong className="text-slate-900 dark:text-slate-100">{activity.workPackage}</strong></span>
                  {activity.area && (
                    <>
                      <span className="text-slate-300">•</span>
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{activity.area}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 font-semibold">
                  <span>Target: {activity.targetQuantity || 0} {activity.unit || 'units'}</span>
                  <span>•</span>
                  <span>Current: {activity.progress || 0}%</span>
                </div>
              </div>

              {/* Progress & State Recorder Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Activity Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value as ActivityStatus)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Overall Progress %
                    </label>
                    <span className="text-xs font-bold text-emerald-600">{progressVal}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <ProgressBar value={progressVal} className="h-1.5" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Actual Quantity Logged ({activity.unit || 'units'})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={actualQtyVal}
                    onChange={(e) => setActualQtyVal(Number(e.target.value))}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Site Metrics Grid */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Site Resources & Safety Metrics
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Workers On Site</label>
                    <input
                      type="number"
                      min={0}
                      value={workersCount}
                      onChange={(e) => setWorkersCount(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Equipment Running</label>
                    <input
                      type="number"
                      min={0}
                      value={equipmentCount}
                      onChange={(e) => setEquipmentCount(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Weather / Temp</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={weatherVal}
                        onChange={(e) => setWeatherVal(e.target.value)}
                        placeholder="Weather"
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-[11px]"
                      />
                      <input
                        type="text"
                        value={tempVal}
                        onChange={(e) => setTempVal(e.target.value)}
                        placeholder="Temp"
                        className="w-1/2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-medium text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">Hours Logged (Calculated)</label>
                    <input
                      type="number"
                      readOnly
                      value={calculatedActualHours}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Camera Integration & Timestamped Site Photos */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-[#0B5FFF]" />
                      Attach Timestamped Site Photos ({reportPhotos.length})
                    </label>
                    <p className="text-[10px] text-slate-500">Capture live camera photos or upload files with automatic timestamp overlays.</p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs gap-1.5 rounded-xl px-3.5 py-1.5 font-semibold shadow-sm"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Open Camera</span>
                  </Button>
                </div>

                {reportPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    {reportPhotos.map((photo, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-video shadow-sm">
                        <img src={photo} alt={`Site photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setReportPhotos(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="Remove Photo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur-xs">
                          📷 Timestamped
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    <span>No site photos attached yet. Tap "Open Camera" to capture.</span>
                  </div>
                )}
              </div>

              {/* Dictation & Supervisor Field Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    Field Observations & Daily Remarks
                  </label>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`text-xs gap-1.5 transition-all ${
                      isRecording 
                        ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                    }`}
                  >
                    {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    <span>{isRecording ? 'Stop Voice Log' : 'Voice Dictate'}</span>
                  </Button>
                </div>

                {isVoiceProcessing && (
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2 animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Processing voice dictation...</span>
                  </div>
                )}

                {micError && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{micError}</span>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Record site activity details, accomplishments, delay factors, or site observations for today..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/40"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveAndPostReport}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs gap-2 px-5 py-2.5 shadow-md shadow-purple-600/20"
                >
                  <FileBarChart className="h-4 w-4" />
                  Save State & Post to Reports
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && createdReport && (
            <div className="flex flex-col gap-5 py-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Activity State Saved & Daily Report Posted!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    State for activity <strong>{activity.name}</strong> was saved and posted to the Daily Site Reports screen.
                  </p>
                </div>
              </div>

              {/* Summary of Saved State */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span>Report ID: {createdReport.id}</span>
                  <Badge variant="outline" className="border-blue-300 text-[#0B5FFF]">
                    {createdReport.date}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Progress</span>
                    <span className="font-bold text-emerald-600">{progressVal}%</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Qty Logged</span>
                    <span className="font-bold">{actualQtyVal} {activity.unit || 'units'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Hours Logged</span>
                    <span className="font-bold">{calculatedActualHours} hrs</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                    <span className="font-bold">{statusVal}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Notes:</span>
                  <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{createdReport.supervisorNotes}</p>
                </div>

                {createdReport.photos && createdReport.photos.length > 0 && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                      Attached Site Photos ({createdReport.photos.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {createdReport.photos.map((photo, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden aspect-video border border-slate-200 dark:border-slate-700">
                          <img src={photo} alt={`Attached site photo ${i + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 bg-black/80 text-white text-[8px] font-mono px-1 py-0.5 rounded">
                            Timestamped
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto rounded-xl text-xs">
                  Close Window
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs gap-2 px-4 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Download / Print PDF Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          activityTag={`${activity.id} - ${activity.name}`}
          onCapture={(capturedPhoto) => {
            setReportPhotos(prev => [...prev, capturedPhoto]);
            setIsCameraOpen(false);
          }}
          onCancel={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
