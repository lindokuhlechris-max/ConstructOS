import React, { useState } from 'react';
import { Activity, ActivityStatus, WORKSTREAMS, WorkstreamType } from '../types';
import { Badge, ProgressBar, Button } from './ui';
import { PTSCrossDisciplineMatrix } from './PTSCrossDisciplineMatrix';
import { SurveyTrackerView } from './SurveyTrackerView';
import { ActivityKanbanBoard } from './ActivityKanbanBoard';
import { ActivityDataTable } from './ActivityDataTable';
import { 
  Compass, 
  ShieldCheck, 
  Package, 
  ShieldAlert, 
  Zap, 
  Building2, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Link2, 
  CheckCircle2, 
  PlayCircle, 
  AlertTriangle, 
  CalendarClock, 
  Layers,
  LayoutGrid,
  List as ListIcon,
  Kanban,
  Table
} from 'lucide-react';

interface DisciplineTrackerViewProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
  onOpenSlideOver: (activity: Activity) => void;
  onOpenLogProgress: (activity: Activity) => void;
  onAddNewDisciplineItem: (workstream: WorkstreamType) => void;
  onUpdateStatus: (activityId: string, newStatus: ActivityStatus) => void;
}

type DisciplineTab = WorkstreamType | 'MATRIX' | 'SURVEY_SPANS';

export function DisciplineTrackerView({
  activities,
  onSelectActivity,
  onOpenSlideOver,
  onOpenLogProgress,
  onAddNewDisciplineItem,
  onUpdateStatus
}: DisciplineTrackerViewProps) {
  const [activeTab, setActiveTab] = useState<DisciplineTab>('MATRIX');
  const [searchTerm, setSearchTerm] = useState('');
  const [subViewMode, setSubViewMode] = useState<'board' | 'table' | 'grid'>('board');

  // Filter activities for selected discipline
  const disciplineActivities = React.useMemo(() => {
    if (activeTab === 'MATRIX' || activeTab === 'SURVEY_SPANS') return activities;
    return activities.filter(a => {
      const matchesWs = a.workstream === activeTab;
      const matchesSearch = !searchTerm || 
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.sectionSpan && a.sectionSpan.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesWs && matchesSearch;
    });
  }, [activities, activeTab, searchTerm]);

  // Discipline Counts
  const counts = React.useMemo(() => {
    return {
      SURVEYING: activities.filter(a => a.workstream === 'SURVEYING').length,
      QA_QC: activities.filter(a => a.workstream === 'QA_QC').length,
      MATERIALS: activities.filter(a => a.workstream === 'MATERIALS').length,
      SAFETY: activities.filter(a => a.workstream === 'SAFETY').length,
      COMMISSIONING: activities.filter(a => a.workstream === 'COMMISSIONING').length,
      PTS_CONSTRUCTION: activities.filter(a => a.workstream === 'PTS_CONSTRUCTION' || !a.workstream).length,
    };
  }, [activities]);

  return (
    <div className="flex flex-col gap-5">
      {/* Discipline Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {/* 1. Master Matrix */}
          <button
            type="button"
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'MATRIX'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Cross-Discipline PTS Matrix</span>
          </button>

          {/* 2. Survey Spans Tracker */}
          <button
            type="button"
            onClick={() => setActiveTab('SURVEY_SPANS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SURVEY_SPANS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Survey Spans Hub</span>
          </button>

          {/* 3. Surveying */}
          <button
            type="button"
            onClick={() => setActiveTab('SURVEYING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SURVEYING'
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 ring-2 ring-sky-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Compass className="h-4 w-4 text-sky-600" />
            <span>Surveying ({counts.SURVEYING})</span>
          </button>

          {/* 4. QA/QC */}
          <button
            type="button"
            onClick={() => setActiveTab('QA_QC')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'QA_QC'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 ring-2 ring-rose-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-rose-600" />
            <span>QA/QC ({counts.QA_QC})</span>
          </button>

          {/* 5. Materials */}
          <button
            type="button"
            onClick={() => setActiveTab('MATERIALS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'MATERIALS'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Package className="h-4 w-4 text-amber-600" />
            <span>Materials ({counts.MATERIALS})</span>
          </button>

          {/* 6. Safety */}
          <button
            type="button"
            onClick={() => setActiveTab('SAFETY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'SAFETY'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-emerald-600" />
            <span>Safety / HSE ({counts.SAFETY})</span>
          </button>

          {/* 7. Commissioning */}
          <button
            type="button"
            onClick={() => setActiveTab('COMMISSIONING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              activeTab === 'COMMISSIONING'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 ring-2 ring-purple-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Zap className="h-4 w-4 text-purple-600" />
            <span>Commissioning ({counts.COMMISSIONING})</span>
          </button>
        </div>

        {/* Action Button for adding item in active discipline */}
        {activeTab !== 'MATRIX' && activeTab !== 'SURVEY_SPANS' && (
          <Button
            onClick={() => onAddNewDisciplineItem(activeTab as WorkstreamType)}
            className="gap-1.5 rounded-xl bg-[#0B5FFF] text-white font-bold h-9 text-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add {WORKSTREAMS[activeTab as WorkstreamType]?.shortName || 'Item'}</span>
          </Button>
        )}
      </div>

      {/* Render Selected Discipline View */}
      {activeTab === 'MATRIX' ? (
        <PTSCrossDisciplineMatrix
          activities={activities}
          onSelectActivity={onSelectActivity}
          onOpenSlideOver={onOpenSlideOver}
        />
      ) : activeTab === 'SURVEY_SPANS' ? (
        <SurveyTrackerView
          onOpenActivity={(actId) => {
            const found = activities.find(a => a.id === actId);
            if (found) onSelectActivity(found);
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Discipline Header & Sub-View Switcher */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {WORKSTREAMS[activeTab as WorkstreamType]?.name}
              </span>
              <span className="text-xs text-slate-400">
                ({disciplineActivities.length} items defined in project scope)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-48 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search discipline items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B5FFF]"
                />
              </div>

              {/* Sub-view switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setSubViewMode('board')}
                  className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${subViewMode === 'board' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-2xs' : 'text-slate-500'}`}
                >
                  <Kanban className="h-3 w-3" />
                  <span className="hidden sm:inline">Board</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubViewMode('table')}
                  className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${subViewMode === 'table' ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-2xs' : 'text-slate-500'}`}
                >
                  <Table className="h-3 w-3" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-view Content */}
          {subViewMode === 'board' ? (
            <ActivityKanbanBoard
              activities={disciplineActivities}
              onSelectActivity={onSelectActivity}
              onOpenSlideOver={onOpenSlideOver}
              onOpenLogProgress={onOpenLogProgress}
              onUpdateStatus={onUpdateStatus}
            />
          ) : (
            <ActivityDataTable
              activities={disciplineActivities}
              onSelectActivity={onSelectActivity}
              onOpenSlideOver={onOpenSlideOver}
              onOpenLogProgress={onOpenLogProgress}
              onUpdateStatus={onUpdateStatus}
            />
          )}
        </div>
      )}
    </div>
  );
}
