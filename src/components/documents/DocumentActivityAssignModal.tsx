import React, { useState } from 'react';
import { Button } from '../ui';
import { X, Link as LinkIcon, Search, CheckCircle2, Unlink, Activity as ActivityIcon, Clock, Check } from 'lucide-react';
import { Activity, DocumentItem } from '../../types';

interface DocumentActivityAssignModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (docId: string, activityId?: string, activityName?: string) => void;
  activities: Activity[];
}

export function DocumentActivityAssignModal({
  document: doc,
  isOpen,
  onClose,
  onAssign,
  activities
}: DocumentActivityAssignModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(doc?.linkedActivityId || '');

  if (!isOpen || !doc) return null;

  const filteredActivities = activities.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.workPackage && a.workPackage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSave = () => {
    if (!selectedActivityId) {
      onAssign(doc.id, undefined, undefined);
    } else {
      const selected = activities.find(a => a.id === selectedActivityId);
      onAssign(doc.id, selected?.id, selected?.name);
    }
    onClose();
  };

  const handleUnlink = () => {
    onAssign(doc.id, undefined, undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
              <LinkIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Link Document to Activity</h2>
              <p className="text-xs text-slate-500 truncate max-w-[280px]">For: <strong>{doc.title}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity by name, ID or trade..."
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>
        </div>

        {/* Activity List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {/* None / Unassigned Option */}
          <div
            onClick={() => setSelectedActivityId('')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              selectedActivityId === ''
                ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-[#0B5FFF]'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500">
                <Unlink className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No Activity (Unassigned)</div>
                <div className="text-xs text-slate-400">Keep this document unlinked as a general project asset</div>
              </div>
            </div>
            {selectedActivityId === '' && (
              <CheckCircle2 className="h-5 w-5 text-[#0B5FFF] shrink-0" />
            )}
          </div>

          {filteredActivities.map((act) => {
            const isSelected = selectedActivityId === act.id;
            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/30 ring-1 ring-[#0B5FFF]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] shrink-0">
                    <ActivityIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{act.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{act.id}</span>
                      <span>•</span>
                      <span>{act.status}</span>
                      <span>•</span>
                      <span>Progress: {act.progress ?? 0}%</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-[#0B5FFF] shrink-0 ml-2" />
                )}
              </div>
            );
          })}

          {filteredActivities.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching activities found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
          {doc.linkedActivityId ? (
            <button
              type="button"
              onClick={handleUnlink}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold flex items-center gap-1"
            >
              <Unlink className="h-3.5 w-3.5" />
              <span>Unlink Current Activity</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-3.5 py-1.5 font-semibold text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 py-1.5 font-semibold text-xs shadow-sm gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Confirm Link</span>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
