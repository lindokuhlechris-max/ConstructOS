import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Layers, 
  Flag, 
  ShieldCheck, 
  FileText, 
  HardDrive, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface HelpSupportModuleProps {
  onBack: () => void;
}

export function HelpSupportModule({ onBack }: HelpSupportModuleProps) {
  const { isOffline, lastSyncedAt, userRole, currentUserProfile } = useAppContext();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const faqs = [
    {
      q: 'How does Offline Sync work in Scedih?',
      a: 'Scedih is built with a local-first offline architecture using IndexedDB and Service Workers. You can record labour check-ins, log activity progress, upload photos, and draft daily reports even with zero internet connectivity. When your device reconnects, all pending changes sync automatically to the cloud.'
    },
    {
      q: 'Why is a parent activity or subtask locked from completion?',
      a: 'Scedih enforces strict hierarchical integrity. A parent activity or parent subtask cannot be marked as "Completed" while any child subtask remains incomplete. In addition, subtasks designated as Milestone Checkpoints require 100% target fulfillment before they can be closed.'
    },
    {
      q: 'How do I backup and restore project data?',
      a: 'Navigate to More > Settings > System & Offline Storage. You can connect your Google Drive account for automatic cloud backups or click "Export JSON Backup" to download an offline encrypted data snapshot.'
    },
    {
      q: 'How do I generate and export Daily Site Reports?',
      a: 'Navigate to the Reports page, select your active project and date, and review aggregated weather, labour attendance, equipment logs, and progress. Click "Export PDF Report" or "Share WhatsApp Summary" to distribute daily logs to stakeholders.'
    },
    {
      q: 'Can I install Scedih as a mobile or desktop app?',
      a: 'Yes! Scedih is a Progressive Web App (PWA). In Chrome/Edge/Safari, tap "Install App" or "Add to Home Screen" to run Scedih in full-screen offline mode on iOS, Android, macOS, and Windows.'
    }
  ];

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackSent(false);
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-[#0B5FFF]" /> Help & Support Center
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Guides, offline system diagnostics, FAQs, and direct technical support.
            </p>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                isOffline ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}>
                {isOffline ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Network Status</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {isOffline ? 'Offline Mode (Local Storage)' : 'Online (Connected & Synchronized)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Last Sync</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Active Role</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentUserProfile?.name || 'User'} ({userRole})
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200 dark:border-slate-800 hover:border-[#0B5FFF] transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF]">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Workflow & WBS Breakdown</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Create structured activities with multi-tier parent-child subtask hierarchies, automated progress synchronization, and milestone sign-off criteria.
          </p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">QA Hold Points</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ensure site quality compliance by gating critical activity milestones with digital supervisor sign-offs.
          </p>
        </Card>

        <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">PWA & Offline First</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Install Scedih directly on smartphones, tablets, or rugged field laptops for full offline performance without network drops.
          </p>
        </Card>
      </div>

      {/* Frequently Asked Questions */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#0B5FFF]" /> Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="p-4 sm:p-5">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left font-semibold text-sm text-slate-800 dark:text-slate-200 gap-4"
                >
                  <span>{faq.q}</span>
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Direct Support & Feedback Form */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#0B5FFF]" /> Technical Support & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {feedbackSent ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              Thank you! Your feedback and technical report have been logged successfully.
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Experiencing an issue or have a feature request? Submit your feedback directly to the Scedih engineering team:
              </p>
              <textarea
                rows={3}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Describe your question, issue, or suggested feature in detail..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-[#0B5FFF]"
                required
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Scedih v1.0 • Enterprise Edition
                </span>
                <Button type="submit" className="bg-[#0B5FFF] rounded-xl text-xs font-bold gap-2">
                  <Mail className="h-3.5 w-3.5" /> Submit Support Request
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
