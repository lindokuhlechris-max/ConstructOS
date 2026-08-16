import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, FileAudio, CheckCircle2, Download, RefreshCw, FileText, Sparkles, Send, Sun, HardHat, Truck, AlertTriangle, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from './ui';
import { DailyReport } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RecordActivityModalProps {
  onClose: () => void;
  onReportGenerated: (report: DailyReport) => void;
  projectId: string;
}

export function RecordActivityModal({ onClose, onReportGenerated, projectId }: RecordActivityModalProps) {
  const [mode, setMode] = useState<'record' | 'preview'>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [textNotes, setTextNotes] = useState('');
  const [generatedReport, setGeneratedReport] = useState<DailyReport | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

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
      console.warn("Microphone access unavailable or denied:", err);
      setIsRecording(false);
      setMicError(err?.message?.includes('denied') || err?.name === 'NotAllowedError' 
        ? "Microphone access was denied. Please allow microphone permission in your browser or type your notes below."
        : "Could not access microphone. You can type your activity summary in the text box below instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        setIsRecording(false);
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        await processAudioOrText(audioBlob, audioBlob.type, undefined);
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleTextSubmit = async () => {
    if (!textNotes.trim()) {
      alert("Please enter or dictate an activity summary.");
      return;
    }
    await processAudioOrText(undefined, undefined, textNotes);
  };

  const processAudioOrText = async (blob?: Blob, mimeType?: string, text?: string) => {
    setIsProcessing(true);
    try {
      let base64data: string | undefined;
      if (blob) {
        base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result as string);
        });
      }

      const response = await fetch('/api/generate-report-from-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64data,
          mimeType,
          textNotes: text,
          projectId
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();

      const newReport: DailyReport = {
        id: `REP-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        projectId: projectId || 'PROJ-001',
        weather: data.weather || 'Sunny',
        temperature: data.temperature || '22°C',
        siteConditions: data.siteConditions || 'Normal site conditions',
        significantEvents: data.significantEvents || '',
        workersOnSite: Number(data.workersOnSite) || 0,
        equipmentRunning: Number(data.equipmentRunning) || 0,
        incidents: Number(data.incidents) || 0,
        ncr: Number(data.ncr) || 0,
        activitiesLogged: Array.isArray(data.activitiesLogged) ? data.activitiesLogged : [],
        supervisorNotes: data.supervisorNotes || textNotes || 'Activity report logged via voice/AI dictation.',
      };

      setGeneratedReport(newReport);
      setMode('preview');
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to process report with AI. Please check network or try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = (report: DailyReport) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(11, 95, 255);
    doc.text(`Daily Activity Report - ${report.id}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${report.date} | Project: ${report.projectId} | Weather: ${report.weather}, ${report.temperature}`, 14, 28);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Key Metrics', 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Workers on Site', 'Equipment Running', 'Incidents', 'NCRs', 'Site Conditions']],
      body: [[
        `${report.workersOnSite} Personnel`,
        `${report.equipmentRunning} Units`,
        `${report.incidents} Incidents`,
        `${report.ncr} NCRs`,
        report.siteConditions || 'Normal'
      ]],
      theme: 'grid',
      headStyles: { fillColor: [11, 95, 255] }
    });

    let currentY = (doc as any).lastAutoTable?.finalY || 65;

    if (report.supervisorNotes) {
      doc.setFontSize(12);
      doc.text('Activity Summary & Notes', 14, currentY + 15);
      doc.setFontSize(10);
      doc.setTextColor(60);
      const splitText = doc.splitTextToSize(report.supervisorNotes, 180);
      doc.text(splitText, 14, currentY + 22);
    }

    doc.save(`Daily_Activity_Report_${report.id}_${report.date}.pdf`);
  };

  const handlePostAndDownload = () => {
    if (!generatedReport) return;
    downloadPDF(generatedReport);
    onReportGenerated(generatedReport);
    onClose();
  };

  const handlePostReport = () => {
    if (!generatedReport) return;
    onReportGenerated(generatedReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border-slate-200 dark:border-slate-800 my-auto">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Mic className="h-5 w-5 text-[#0B5FFF]" /> 
            Record Daily Activity
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dictate or type your site activities for today to format a structured report and post it to Reports & PDF.
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {mode === 'record' && (
            <div className="flex flex-col gap-6">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-slate-500">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#0B5FFF]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 animate-pulse">
                    Processing audio and formatting report...
                  </p>
                </div>
              ) : (
                <>
                  {/* Voice Recorder Section */}
                  <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <button 
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-md ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-[0_0_0_12px_rgba(239,68,68,0.25)] animate-pulse' 
                          : 'bg-[#0B5FFF] hover:bg-blue-600 text-white hover:scale-105'
                      }`}
                      title={isRecording ? 'Click to Stop' : 'Click to Record'}
                    >
                      {isRecording ? <Square className="h-10 w-10 fill-current" /> : <Mic className="h-10 w-10" />}
                    </button>

                    <div className="text-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {isRecording ? 'Recording in progress... Click to stop' : 'Tap to Record Voice Note'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Describe what was achieved on site, workers, weather, and equipment.
                      </p>
                    </div>

                    {micError && (
                      <div className="w-full max-w-md p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">{micError}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Or Type Section */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[#0B5FFF]" />
                      Or Type / Paste Activity Summary
                    </label>
                    <textarea
                      rows={3}
                      value={textNotes}
                      onChange={(e) => setTextNotes(e.target.value)}
                      placeholder="e.g. Fine weather, 12 workers on site. 3 excavators running. Completed foundation concrete pouring for Section A."
                      className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/50"
                    />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Sample:</span>
                      <button 
                        onClick={() => setTextNotes("Sunny weather, 14 workers on site. 2 cranes & 4 trucks operating. Rebar tying completed for Slab 2. No safety incidents.")}
                        className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        + Standard Day Log
                      </button>
                      <button 
                        onClick={() => setTextNotes("Overcast weather, 8 workers on site. Excavator operational. Trenching in progress at Chainage 150m.")}
                        className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        + Earthworks Log
                      </button>
                    </div>

                    <Button 
                      onClick={handleTextSubmit}
                      disabled={!textNotes.trim() || isProcessing}
                      className="mt-2 bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold rounded-xl gap-2 w-full"
                    >
                      <FileText className="h-4 w-4" />
                      Format Daily Report
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'preview' && generatedReport && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Daily Report Generated Successfully!
                </span>
                <Badge variant="outline" className="border-emerald-300 text-emerald-700 font-mono">
                  {generatedReport.id}
                </Badge>
              </div>

              {/* Formatted Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Workers</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{generatedReport.workersOnSite}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Equipment</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{generatedReport.equipmentRunning} Units</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Weather</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-50 truncate block mt-1">{generatedReport.weather} ({generatedReport.temperature})</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50/70 dark:bg-red-950/40 border border-red-100 dark:border-red-900">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">Incidents / NCR</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{generatedReport.incidents} / {generatedReport.ncr}</span>
                </div>
              </div>

              {/* Formatted Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">Activity Summary & Notes</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {generatedReport.supervisorNotes}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => setMode('record')}
                  className="w-full sm:w-auto text-xs gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-record
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handlePostReport}
                  className="w-full sm:w-auto text-xs gap-1.5 border-blue-200 text-[#0B5FFF] hover:bg-blue-50"
                >
                  Post to Reports
                </Button>
                <Button 
                  onClick={handlePostAndDownload}
                  className="w-full sm:w-auto text-xs gap-1.5 bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" /> Post & Printable PDF
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end w-full border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing} className="text-xs text-slate-500">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
