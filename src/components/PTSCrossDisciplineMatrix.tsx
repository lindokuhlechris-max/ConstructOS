import React, { useState } from 'react';
import { Activity, SubTask } from '../types';
import { Badge, ProgressBar, Button } from './ui';
import { 
  Compass, 
  Building2, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  PlayCircle, 
  AlertTriangle, 
  CalendarClock, 
  Link2, 
  ChevronRight, 
  ExternalLink, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';

interface PTSCrossDisciplineMatrixProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenSlideOver: (activity: Activity) => void;
}

export function PTSCrossDisciplineMatrix({
  activities,
  onSelectActivity,
  onOpenSlideOver
}: PTSCrossDisciplineMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReadiness, setFilterReadiness] = useState<'all' | 'ready' | 'in_progress' | 'hold' | 'completed'>('all');

  // Extract all distinct PTS section spans across all activities and subtasks
  const sectionSpans = React.useMemo(() => {
    const spanMap: Record<string, {
      span: string;
      ptsActivities: Activity[];
      surveyItems: { title: string; status: string; surveyor?: string; coords?: string; subtask?: SubTask; activity?: Activity }[];
      qaItems: { title: string; status: string; inspector?: string; holdPoint?: boolean; subtask?: SubTask; activity?: Activity }[];
      materialItems: { title: string; status: string; batch?: string; subtask?: SubTask; activity?: Activity }[];
      safetyItems: { title: string; status: string; permit?: string; subtask?: SubTask; activity?: Activity }[];
      commissioningItems: { title: string; status: string; subtask?: SubTask; activity?: Activity }[];
    }> = {};

    // Helper to get or init span
    const getSpan = (name: string) => {
      const cleanName = name.trim();
      if (!spanMap[cleanName]) {
        spanMap[cleanName] = {
          span: cleanName,
          ptsActivities: [],
          surveyItems: [],
          qaItems: [],
          materialItems: [],
          safetyItems: [],
          commissioningItems: []
        };
      }
      return spanMap[cleanName];
    };

    // Scan all activities
    activities.forEach(act => {
      // Find span
      let spanKey = act.sectionSpan || '';
      if (!spanKey && act.name) {
        const ptsMatch = act.name.match(/PTS\s*\d+\s*(?:TO|-)\s*PTS\s*\d+/i);
        if (ptsMatch) {
          spanKey = ptsMatch[0].toUpperCase().replace(/\s*TO\s*/i, ' - ');
        }
      }

      if (spanKey) {
        const s = getSpan(spanKey);
        if (act.workstream === 'PTS_CONSTRUCTION' || !act.workstream) {
          s.ptsActivities.push(act);
        } else if (act.workstream === 'SURVEYING') {
          s.surveyItems.push({
            title: act.name,
            status: act.status,
            activity: act
          });
        } else if (act.workstream === 'QA_QC') {
          s.qaItems.push({
            title: act.name,
            status: act.status,
            holdPoint: true,
            activity: act
          });
        } else if (act.workstream === 'MATERIALS') {
          s.materialItems.push({
            title: act.name,
            status: act.status,
            activity: act
          });
        } else if (act.workstream === 'SAFETY') {
          s.safetyItems.push({
            title: act.name,
            status: act.status,
            activity: act
          });
        }
      }

      // Check subtasks for linked disciplines
      (act.subtasks || []).forEach(st => {
        let subSpan = st.sectionSpan || spanKey;
        if (!subSpan && st.title) {
          const m = st.title.match(/PTS\s*\d+\s*(?:TO|-)\s*PTS\s*\d+/i);
          if (m) subSpan = m[0].toUpperCase().replace(/\s*TO\s*/i, ' - ');
        }

        if (subSpan) {
          const s = getSpan(subSpan);
          if (st.category === 'Surveying & Set-out' || st.surveyData || st.isLinkedDiscipline) {
            s.surveyItems.push({
              title: st.title,
              status: st.status,
              surveyor: st.surveyData?.surveyorName,
              coords: st.surveyData?.coordinates,
              subtask: st,
              activity: act
            });
          }
          if (st.isHoldPoint || st.category === 'Quality Control & Hold Points') {
            s.qaItems.push({
              title: st.title,
              status: st.holdPointSignOff?.approved ? 'Completed' : st.status,
              inspector: st.holdPointSignOff?.signedBy,
              holdPoint: true,
              subtask: st,
              activity: act
            });
          }
          if (st.category === 'Duct Installation & Bedding' || (st.assignments && st.assignments.length > 0)) {
            s.materialItems.push({
              title: st.title,
              status: st.status,
              subtask: st,
              activity: act
            });
          }
        }
      });
    });

    // Default mock spans if none extracted yet
    if (Object.keys(spanMap).length === 0) {
      for (let i = 1; i <= 21; i++) {
        const next = i + 1;
        const name = `PTS ${i} - PTS ${next}`;
        spanMap[name] = {
          span: name,
          ptsActivities: [],
          surveyItems: [],
          qaItems: [],
          materialItems: [],
          safetyItems: [],
          commissioningItems: []
        };
      }
    }

    return Object.values(spanMap).sort((a, b) => {
      const numA = parseInt(a.span.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.span.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    });
  }, [activities]);

  const filteredSpans = sectionSpans.filter(item => {
    if (searchTerm && !item.span.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    const hasSurveyDone = item.surveyItems.some(s => s.status === 'Completed');
    const hasHoldPointActive = item.qaItems.some(q => q.holdPoint && q.status !== 'Completed');
    const isCivilDone = item.ptsActivities.length > 0 && item.ptsActivities.every(a => a.status === 'Completed');
    const isCivilInProg = item.ptsActivities.some(a => a.status === 'In Progress');

    if (filterReadiness === 'ready') return hasSurveyDone && !isCivilDone;
    if (filterReadiness === 'hold') return hasHoldPointActive;
    if (filterReadiness === 'in_progress') return isCivilInProg;
    if (filterReadiness === 'completed') return isCivilDone;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h3 className="text-base font-bold">Cross-Discipline PTS Readiness Matrix</h3>
          </div>
          <p className="text-xs text-blue-200/90 leading-relaxed">
            Multi-disciplinary project model linking <strong>Surveying</strong>, <strong>Civil Works</strong>, <strong>Materials</strong>, <strong>Safety</strong>, and <strong>QA Hold Points</strong> across all section spans.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Filter by PTS span (e.g. PTS 19)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 px-3 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-blue-200/60 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button
          type="button"
          onClick={() => setFilterReadiness('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterReadiness === 'all' 
              ? 'bg-[#0B5FFF] text-white shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Spans ({sectionSpans.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterReadiness('ready')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterReadiness === 'ready' 
              ? 'bg-sky-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          📐 Survey Cleared
        </button>
        <button
          type="button"
          onClick={() => setFilterReadiness('in_progress')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterReadiness === 'in_progress' 
              ? 'bg-blue-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          🚀 Active Construction
        </button>
        <button
          type="button"
          onClick={() => setFilterReadiness('hold')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterReadiness === 'hold' 
              ? 'bg-rose-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          🛑 QA Hold Point Pending
        </button>
        <button
          type="button"
          onClick={() => setFilterReadiness('completed')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
            filterReadiness === 'completed' 
              ? 'bg-emerald-600 text-white shadow-xs' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          ✅ Fully Delivered
        </button>
      </div>

      {/* Grid of Section Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSpans.map(item => {
          const mainPTS = item.ptsActivities[0];
          const hasSurveyDone = item.surveyItems.some(s => s.status === 'Completed');
          const isCivilDone = mainPTS?.status === 'Completed';
          const hasActiveHold = item.qaItems.some(q => q.holdPoint && q.status !== 'Completed');

          return (
            <div 
              key={item.span}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col gap-3 hover:border-[#0B5FFF]/50 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    📍 {item.span}
                  </span>
                </div>

                {/* Overall Readiness Pill */}
                {isCivilDone ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Delivered
                  </span>
                ) : hasActiveHold ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Hold Point
                  </span>
                ) : hasSurveyDone ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    Ready to Trench
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Planning
                  </span>
                )}
              </div>

              {/* 5 Disciplines Handshake Matrix */}
              <div className="grid grid-cols-1 gap-2 text-xs">
                {/* 1. Surveying */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Surveying & Pegging</span>
                  </div>
                  {item.surveyItems.length > 0 ? (
                    item.surveyItems.some(s => s.status === 'Completed') ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Pegged & Cleared
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" /> In Progress
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Not recorded yet</span>
                  )}
                </div>

                {/* 2. Materials */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Materials & Ducts</span>
                  </div>
                  {item.materialItems.length > 0 ? (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Batch Allocated
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Standard Allocation</span>
                  )}
                </div>

                {/* 3. Safety */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Safety & Trench Permit</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Daily Permit Active
                  </span>
                </div>

                {/* 4. PTS Civil Works */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Civil & Trenching</span>
                  </div>
                  {mainPTS ? (
                    <span className="text-[10px] font-bold text-[#0B5FFF] dark:text-blue-400">
                      {mainPTS.status} ({mainPTS.progress || 0}%)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Not Started</span>
                  )}
                </div>

                {/* 5. QA/QC Hold Points */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">QA Hold Points</span>
                  </div>
                  {item.qaItems.length > 0 ? (
                    item.qaItems.some(q => q.status === 'Completed') ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        ✅ Signed Off
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        ⏳ Hold Point Pending
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">No Active Hold</span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {mainPTS ? (
                <Button
                  onClick={() => onSelectActivity(mainPTS)}
                  size="sm"
                  className="w-full h-8 text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 mt-1"
                >
                  Inspect PTS Section <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <div className="text-[11px] text-center text-slate-400 py-1 font-medium">
                  {item.span} configured in project spans
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
