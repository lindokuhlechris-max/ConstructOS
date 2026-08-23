import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Check, 
  Layers, 
  CheckSquare, 
  Square, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Filter, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Activity } from '../../types';

interface QAActivityMultiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedActivityIds: string[];
  onApply: (selectedIds: string[]) => void;
  activities: Activity[];
  projectId?: string;
  projectName?: string;
  title?: string;
}

export function QAActivityMultiSelectModal({
  isOpen,
  onClose,
  selectedActivityIds,
  onApply,
  activities,
  projectId,
  projectName,
  title = 'Link Activities to QA Inspection'
}: QAActivityMultiSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectOnly, setFilterProjectOnly] = useState(!!projectId);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedActivityIds);

  // Sync temp state when opening
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedActivityIds || []);
      setSearchQuery('');
    }
  }, [isOpen, selectedActivityIds]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let list = activities;
    if (filterProjectOnly && projectId) {
      list = list.filter(a => a.projectId === projectId);
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.location && a.location.toLowerCase().includes(q)) ||
      (a.workPackage && a.workPackage.toLowerCase().includes(q)) ||
      (a.discipline && a.discipline.toLowerCase().includes(q))
    );
  }, [activities, filterProjectOnly, projectId, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setTempSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredActivities.map(a => a.id);
    setTempSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
  };

  const handleDeselectAllVisible = () => {
    const visibleIdSet = new Set(filteredActivities.map(a => a.id));
    setTempSelectedIds(prev => prev.filter(id => !visibleIdSet.has(id)));
  };

  const handleApply = () => {
    onApply(tempSelectedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{title}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {tempSelectedIds.length} Selected
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Select one or multiple construction activities to associate with this QA inspection record.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Quick Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by ID (e.g. ACT-9830), name, chainage or discipline..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {projectId && (
              <button
                type="button"
                onClick={() => setFilterProjectOnly(!filterProjectOnly)}
                className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                  filterProjectOnly
                    ? 'bg-blue-50 border-blue-200 text-[#0B5FFF] dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
                title="Filter by current project"
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{filterProjectOnly ? 'Project Only' : 'All Projects'}</span>
              </button>
            )}
          </div>

          {/* Quick Select Tooling Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredActivities.length} available activities</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
              >
                Select All ({filteredActivities.length})
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="text-slate-500 hover:text-rose-600 font-semibold hover:underline"
              >
                Deselect Visible
              </button>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {filteredActivities.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Layers className="h-8 w-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-sm font-medium">No matching activities found</p>
              <p className="text-xs">Try adjusting your search query or removing the project filter.</p>
            </div>
          ) : (
            filteredActivities.map(activity => {
              const isSelected = tempSelectedIds.includes(activity.id);
              const progressVal = activity.progress ?? 0;

              return (
                <div
                  key={activity.id}
                  onClick={() => toggleSelect(activity.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(activity.id);
                      }}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                          {activity.id}
                        </span>
                        {activity.workPackage && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {activity.workPackage}
                          </span>
                        )}
                        {activity.discipline && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                            {activity.discipline}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activity.name}
                      </h4>

                      <div className="flex items-center gap-x-3 gap-y-1 text-xs text-slate-500 flex-wrap">
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {activity.location}
                          </span>
                        )}
                        {activity.startDate && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {activity.startDate} {activity.endDate ? `→ ${activity.endDate}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Badge */}
                  <div className="shrink-0 flex flex-col items-end gap-1 text-right">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {progressVal}%
                    </span>
                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          progressVal >= 100 ? 'bg-emerald-500' : progressVal > 0 ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setTempSelectedIds([])}
            disabled={tempSelectedIds.length === 0}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear Selection
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Link {tempSelectedIds.length} {tempSelectedIds.length === 1 ? 'Activity' : 'Activities'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
