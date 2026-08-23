import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { 
  FileBarChart, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft, 
  Calendar, 
  Building2, 
  Layers, 
  TrendingUp, 
  HardHat, 
  ShieldAlert, 
  Clock, 
  Sparkles,
  Check,
  AlertTriangle
} from 'lucide-react';
import { UniversalReportItem, WeeklyProgressReportData } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { UniversalReportPrintStudioModal } from './UniversalReportPrintStudioModal';
import { ReportAttachmentSection } from './ReportAttachmentSection';

interface ProgressReportDetailProps {
  report: UniversalReportItem<WeeklyProgressReportData>;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (id: string) => void;
  onSave?: (updated: UniversalReportItem<WeeklyProgressReportData>) => void;
}

export function ProgressReportDetail({ report, onClose, onEdit, onDelete, onSave }: ProgressReportDetailProps) {
  const { currentUserProfile } = useAppContext();
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isPrintStudioOpen, setIsPrintStudioOpen] = useState(false);
  const [signoffNotes, setSignoffNotes] = useState('');

  const wData = report.data || {} as WeeklyProgressReportData;
  const activities = wData.activities || [];
  const lookaheads = wData.lookaheadSchedule || [];

  const handleApproveSignoff = () => {
    if (!onSave) return;
    const newSignoff = {
      role: currentUserProfile?.role || 'Resident Engineer (Consultant)',
      name: currentUserProfile?.name || 'Authorized Consultant',
      date: new Date().toISOString().split('T')[0],
      status: 'Approved' as const,
      notes: signoffNotes || 'All weekly activity progress and safety records approved.'
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
      
      {/* Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Reports
              </button>
              <Badge variant="outline" className="font-mono text-xs text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
                {report.documentNumber}
              </Badge>
              <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {report.revision}
              </Badge>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                report.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {report.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <FileBarChart className="h-6 w-6 text-[#0B5FFF]" /> {report.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4 flex-wrap">
              <span>Period: <strong className="text-slate-700 dark:text-slate-200">{wData.startDate} to {wData.endDate} (Week {wData.weekNumber})</strong></span>
              <span>Submitted: <strong className="text-blue-600 dark:text-blue-400 font-mono">{report.submissionDate || report.date}</strong></span>
              <span>Prepared By: <strong className="text-slate-700 dark:text-slate-200">{report.author}</strong></span>
            </p>
          </div>

          {/* Action Buttons - Expandable Icons */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            {/* Print */}
            <button
              onClick={() => setIsPrintStudioOpen(true)}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Print & PDF Studio"
            >
              <Printer className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-[#0B5FFF]" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Print Studio
              </span>
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Edit Progress Report"
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
                  if (confirm(`Are you sure you want to delete Progress Report "${report.title}"?`)) {
                    onDelete(report.id);
                  }
                }}
                className="group h-9 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
                title="Delete Progress Report"
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
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Weekly Physical Progress</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-emerald-600">{wData.actualWeeklyProgressPct}%</span>
            <span className="text-xs text-slate-400">Plan: {wData.plannedWeeklyProgressPct}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Cumulative Project Progress</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-[#0B5FFF]">{wData.cumulativeActualProgressPct}%</span>
            <span className="text-xs text-slate-400">Plan: {wData.cumulativePlannedProgressPct}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Safe Working Man-Hours</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{wData.safeManHoursThisWeek?.toLocaleString()} hrs</span>
            <span className="text-xs text-slate-400">Peak: {wData.workersPeakCount} pax</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">QA Clearances & Safety</span>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-2xl font-bold text-emerald-600">{wData.inspectionsConducted || 0} QA Passed</span>
            <span className="text-xs text-emerald-600">{wData.incidentsCount || 0} Incidents</span>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
          <span>Executive Weekly Overview & Operations Summary</span>
        </h3>
        <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {wData.executiveSummary || report.summaryNotes}
        </p>
      </div>

      {/* Activities Breakdown Snapshot */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0B5FFF]" />
            <span>Activity Work Package Progress Matrix ({activities.length} Packages)</span>
          </h3>
          <span className="text-xs text-slate-400">Weekly Output vs Planned Targets</span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                <th className="p-3">Activity ID</th>
                <th className="p-3">Activity Description</th>
                <th className="p-3">Work Package</th>
                <th className="p-3 text-right">Planned (Week)</th>
                <th className="p-3 text-right">Actual (Week)</th>
                <th className="p-3 text-right">Cumulative %</th>
                <th className="p-3 text-center">Variance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {activities.map(act => (
                <tr key={act.activityId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{act.activityId}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{act.activityName}</td>
                  <td className="p-3 text-slate-500">{act.workPackage}</td>
                  <td className="p-3 text-right font-mono">{act.plannedThisWeek} {act.unit}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-600">{act.actualThisWeek} {act.unit}</td>
                  <td className="p-3 text-right font-mono font-bold text-[#0B5FFF]">{act.cumulativeProgressPct}%</td>
                  <td className={`p-3 text-center font-mono font-bold ${act.variancePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {act.variancePct >= 0 ? `+${act.variancePct}%` : `${act.variancePct}%`}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                      {act.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-500 text-[11px] italic">{act.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Week Lookahead Schedule */}
      {lookaheads.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <span>Two-Week Lookahead Execution Schedule</span>
            </h3>
            <span className="text-xs text-slate-400">Upcoming Planned Works</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lookaheads.map((look, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                  <span>{look.activityName}</span>
                  <Badge className="bg-purple-600 text-white text-[10px]">{look.plannedVolume}</Badge>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-4 font-mono">
                  <span>Target: {look.targetStartDate} to {look.targetFinishDate}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
                  <strong className="text-purple-700 dark:text-purple-300">Resources:</strong> {look.resourcesRequired}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attached Documents and Site Photos */}
      <ReportAttachmentSection
        attachments={report.attachments}
        photos={report.photos}
        currentUser={currentUserProfile?.name || 'Progress Lead'}
        readOnly={!onSave}
        title="Weekly Progress Documents & Aerial Photos"
        description="Attach drone orthomosaics, site progress photos, contractor submittal documents, and lookahead schedule sheets."
        onChange={(updatedAttachments, updatedPhotos) => {
          if (onSave) {
            onSave({
              ...report,
              attachments: updatedAttachments,
              photos: updatedPhotos
            });
          }
        }}
      />

      {/* Multi-Signatory Sign-Off Sheet */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Multi-Party Verification & Sign-Off Endorsements</span>
          </h3>
          <span className="text-[11px] text-slate-400">Formal Progress Endorsements</span>
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
              No formal signoffs recorded yet. Click "Approve Signoff" to record progress verification.
            </div>
          )}
        </div>
      </div>

      {/* Sign-Off Modal */}
      {isSignoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Endorse Weekly Progress
            </h3>
            <p className="text-xs text-slate-500">
              Certify that weekly quantities and man-hour reports reflect on-site construction progression.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval Comments</label>
              <textarea
                rows={3}
                value={signoffNotes}
                onChange={e => setSignoffNotes(e.target.value)}
                placeholder="e.g. Physical progress approved against contractual baseline."
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
          reportType="progress"
        />
      )}
    </div>
  );
}
