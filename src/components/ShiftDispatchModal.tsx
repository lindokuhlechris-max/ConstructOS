import React, { useState, useEffect } from 'react';
import { Activity, Project, SubTask } from '../types';
import { Button, Badge } from './ui';
import { 
  X, 
  Share2, 
  Printer, 
  FileText, 
  Smartphone, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Users, 
  Calendar, 
  ShieldAlert, 
  Sparkles,
  MessageSquare,
  Send,
  Zap,
  Info,
  CheckSquare,
  Square,
  Search,
  Filter,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { 
  generateWhatsAppDispatchText, 
  generateSupervisorReturnTemplate, 
  downloadStandaloneMobileHtml,
  generateStandaloneMobileHtml 
} from '../lib/shiftDispatchUtils';
import { printShiftTicketPdf } from '../lib/pdfPrint';

interface ShiftDispatchModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  employees?: any[];
}

export function ShiftDispatchModal({
  activity,
  isOpen,
  onClose,
  project,
  employees = []
}: ShiftDispatchModalProps) {
  if (!isOpen || !activity) return null;

  const allSubtasks: SubTask[] = activity.subtasks || [];

  const [activeTab, setActiveTab] = useState<'whatsapp' | 'pdf' | 'offline_html' | 'return_template'>('whatsapp');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [supervisorPhone, setSupervisorPhone] = useState<string>('');
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [selectedSubtaskIds, setSelectedSubtaskIds] = useState<string[]>(() => allSubtasks.map(s => s.id));
  const [subtaskSearchQuery, setSubtaskSearchQuery] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Sync selected subtasks when activity changes
  useEffect(() => {
    if (activity?.subtasks) {
      setSelectedSubtaskIds(activity.subtasks.map(s => s.id));
    }
  }, [activity?.id]);

  const incompleteSubtasks = allSubtasks.filter(s => s.status !== 'Completed');
  const holdPointSubtasks = allSubtasks.filter(s => s.isHoldPoint);

  const toggleSubtaskId = (id: string) => {
    setSelectedSubtaskIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllSubtasks = () => {
    setSelectedSubtaskIds(allSubtasks.map(s => s.id));
  };

  const selectIncompleteSubtasks = () => {
    setSelectedSubtaskIds(incompleteSubtasks.map(s => s.id));
  };

  const selectHoldPointsOnly = () => {
    setSelectedSubtaskIds(holdPointSubtasks.map(s => s.id));
  };

  const deselectAllSubtasks = () => {
    setSelectedSubtaskIds([]);
  };

  const dispatchOptions = {
    supervisorName: supervisorName.trim() || undefined,
    supervisorPhone: supervisorPhone.trim() || undefined,
    shiftDate,
    customInstructions: customInstructions.trim() || undefined,
    projectName: project?.name,
    selectedSubtaskIds
  };

  const whatsAppText = generateWhatsAppDispatchText(activity, dispatchOptions);
  const returnTemplateText = generateSupervisorReturnTemplate(activity, dispatchOptions);

  const handleCopyWhatsApp = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsAppText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText);
    const phoneClean = supervisorPhone.replace(/[^0-9]/g, '');
    const url = phoneClean 
      ? `https://wa.me/${phoneClean}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handlePrintPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await printShiftTicketPdf({
        project,
        activity,
        supervisorName: supervisorName || 'Site Supervisor',
        shiftDate,
        customInstructions,
        selectedSubtaskIds
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadStandaloneMobileHtml(activity, dispatchOptions);
  };

  const filteredSubtasks = allSubtasks.filter(st => {
    if (!subtaskSearchQuery.trim()) return true;
    const q = subtaskSearchQuery.toLowerCase();
    return st.title.toLowerCase().includes(q) || (st.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  Field Shift Dispatch & Offline Work Orders
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {activity.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Send activity scope, subtasks & QA gates to supervisors on site (Zero Cloud Required)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/40 dark:bg-slate-800/20 flex gap-2 overflow-x-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-[#25D366] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>💬 WhatsApp Dispatch</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'pdf'
                ? 'bg-[#0B5FFF] text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>📄 1-Page PDF Shift Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline_html')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'offline_html'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>📱 Offline Mobile Form (.html)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('return_template')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'return_template'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>📋 Return Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Target Supervisor & Shift Setup Controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Assigned Supervisor
              </label>
              {employees && employees.length > 0 ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    list="supervisorSuggestions"
                    placeholder="e.g. John Foreman"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <datalist id="supervisorSuggestions">
                    {employees.map((emp, i) => (
                      <option key={emp.id || i} value={emp.name}>
                        {emp.role ? `${emp.name} (${emp.role})` : emp.name}
                      </option>
                    ))}
                  </datalist>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. John Foreman"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Supervisor Phone (Optional)
              </label>
              <input
                type="text"
                placeholder="+27 82 123 4567"
                value={supervisorPhone}
                onChange={(e) => setSupervisorPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Execution Date
              </label>
              <input
                type="date"
                value={shiftDate}
                onChange={(e) => setShiftDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Special Safety Notes / Peg Chainage Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Hard hats required, soil density testing required before backfill at CH 0+200..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* TAB 1: WHATSAPP TASK DISPATCH */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="leading-relaxed text-[11px]">
                    Copies a structured work order with checkboxes, subtask targets, allocated plant, and QA hold point warnings directly into WhatsApp. The supervisor replies with their outputs at shift end.
                  </p>
                  {allSubtasks.length > 0 && (
                    <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 pt-0.5">
                      <span>Including {selectedSubtaskIds.length} of {allSubtasks.length} subtasks</span>
                      {selectedSubtaskIds.length < allSubtasks.length && (
                        <button
                          type="button"
                          onClick={selectAllSubtasks}
                          className="underline hover:text-emerald-900 dark:hover:text-emerald-100 cursor-pointer"
                        >
                          (Include All)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    WhatsApp Message Preview
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? 'Copied to Clipboard!' : 'Copy Text'}
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[280px] custom-scrollbar border border-slate-800">
                  {whatsAppText}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyWhatsApp}
                  className="rounded-xl px-5 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  {isCopied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="rounded-xl px-6 text-xs font-bold bg-[#25D366] hover:bg-[#1EBE5D] text-white gap-2 shadow-sm cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Open in WhatsApp</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: 1-PAGE PDF SHIFT TICKET */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
                <FileText className="h-4 w-4 text-[#0B5FFF] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="leading-relaxed text-[11px]">
                    Generates an executive 1-Page A4 PDF Daily Shift Ticket. Includes full method subtasks, target vs prior log, fill-in boxes, QA Hold Point verification lines, workforce rosters, and supervisor signature blocks.
                  </p>
                  {allSubtasks.length > 0 && (
                    <div className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 pt-0.5">
                      <span>Including {selectedSubtaskIds.length} of {allSubtasks.length} subtasks</span>
                      {selectedSubtaskIds.length < allSubtasks.length && (
                        <button
                          type="button"
                          onClick={selectAllSubtasks}
                          className="underline hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"
                        >
                          (Include All)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Document Layout Breakdown</span>
                  <Badge variant="outline" className="text-[10px]">1-Page Executive Format</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold block text-slate-900 dark:text-white">📋 Header & WBS Scope</span>
                    <span>WO Ref ID, project name, discipline, target units, and chainage.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold block text-slate-900 dark:text-white">✅ Subtask Checklist Table</span>
                    <span>{selectedSubtaskIds.length} selected subtask(s) with fill-in blanks & QA sign-offs.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold block text-slate-900 dark:text-white">👷 Crew & Plant Allocation</span>
                    <span>{(activity.assignedLabour || []).length} personnel & {(activity.assignedEquipment || []).length} active machines listed.</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <span className="font-bold block text-slate-900 dark:text-white">✍️ Signature & Delay Block</span>
                    <span>Sign-off lines for Supervisor and QA/QC Inspector.</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  disabled={isGeneratingPdf || (allSubtasks.length > 0 && selectedSubtaskIds.length === 0)}
                  onClick={handlePrintPdf}
                  className="rounded-xl px-6 text-xs font-bold bg-[#0B5FFF] hover:bg-blue-700 text-white gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : `Download / Print Shift Ticket PDF (${selectedSubtaskIds.length} Subtasks)`}</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: OFFLINE MOBILE FORM (.HTML) */}
          {activeTab === 'offline_html' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900 dark:text-purple-200">
                <Smartphone className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  Downloads a self-contained, interactive single-file <strong>.html</strong> form. Send this file to the supervisor via WhatsApp/email. They can open it on their phone browser (100% offline), tap output increment steppers, and tap <strong>"Send via WhatsApp"</strong> to reply back with structured data!
                </p>
              </div>

              {/* SUBTASK SELECTION CARD FOR OFFLINE MOBILE FORM */}
              {allSubtasks.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-900/70 shadow-xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-purple-600" />
                        Select Subtasks for Mobile Form
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedSubtaskIds.length === 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      }`}>
                        {selectedSubtaskIds.length} of {allSubtasks.length} Selected
                      </span>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={selectAllSubtasks}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors cursor-pointer"
                      >
                        Select All ({allSubtasks.length})
                      </button>
                      {incompleteSubtasks.length > 0 && incompleteSubtasks.length < allSubtasks.length && (
                        <button
                          type="button"
                          onClick={selectIncompleteSubtasks}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Incomplete Only ({incompleteSubtasks.length})
                        </button>
                      )}
                      {holdPointSubtasks.length > 0 && (
                        <button
                          type="button"
                          onClick={selectHoldPointsOnly}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                        >
                          QA Hold ({holdPointSubtasks.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={deselectAllSubtasks}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Subtask Search Filter if more than 3 */}
                  {allSubtasks.length > 3 && (
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search subtasks by title or category..."
                        value={subtaskSearchQuery}
                        onChange={(e) => setSubtaskSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  {/* Subtasks Checkbox List */}
                  <div className="space-y-1.5 max-h-[260px] overflow-y-auto custom-scrollbar p-1">
                    {filteredSubtasks.map((st) => {
                      const isSelected = selectedSubtaskIds.includes(st.id);
                      const originalIdx = allSubtasks.findIndex(s => s.id === st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => toggleSubtaskId(st.id)}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800/80 shadow-2xs'
                              : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 text-purple-600 dark:text-purple-400">
                              {isSelected ? (
                                <CheckSquare className="h-4 w-4 text-purple-600" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 shrink-0">
                              #{originalIdx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className={`text-xs font-bold truncate block ${
                                isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {st.title}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                <span>{st.category || 'General'}</span>
                                <span>•</span>
                                <span>Target: {st.targetQuantity || 0} {st.unit || 'units'}</span>
                                {st.completedQuantity ? <span>(Done: {st.completedQuantity})</span> : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {st.isHoldPoint && (
                              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> QA Hold
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              st.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : st.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {st.status || 'Not Started'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedSubtaskIds.length === 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Please select at least 1 subtask to generate the offline mobile form.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Mobile Offline Features</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    Zero Server / Internet Required
                  </span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600" />
                    <span>Works on all Android & iPhone browsers directly from WhatsApp attachment.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600" />
                    <span>Includes +/- output steppers, chainage notes, and QA hold point quality sign-offs.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600" />
                    <span>One-tap WhatsApp response generation encodes selected subtask output to send back to office.</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  disabled={allSubtasks.length > 0 && selectedSubtaskIds.length === 0}
                  onClick={handleDownloadHtml}
                  className="rounded-xl px-6 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download Standalone Mobile Form (.html)
                    {allSubtasks.length > 0 ? ` • (${selectedSubtaskIds.length} Subtask${selectedSubtaskIds.length === 1 ? '' : 's'})` : ''}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: RETURN TEMPLATE */}
          {activeTab === 'return_template' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  This is the standard structured reply template. When the supervisor sends this back on WhatsApp, you can copy & paste it into the <strong>"Paste WhatsApp Report"</strong> button in Quick Log Progress to auto-fill everything in 1 second!
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1.5">
                  Supervisor Return Template
                </span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-amber-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[260px] custom-scrollbar border border-slate-800">
                  {returnTemplateText}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(returnTemplateText);
                      alert('Return template copied to clipboard!');
                    }
                  }}
                  className="rounded-xl px-5 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Return Template</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60 flex-shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            Shift Work Order • {activity.id}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl px-5 text-xs font-semibold cursor-pointer"
          >
            Done / Close
          </Button>
        </div>
      </div>
    </div>
  );
}
