import React from 'react';
import { 
  AlertTriangle, 
  Check, 
  Cloud, 
  HardDrive, 
  X, 
  ArrowRight, 
  Clock, 
  GitCompare,
  FileText,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { SyncConflict } from '../types';

interface SyncConflictModalProps {
  conflict: SyncConflict;
  onResolve: (resolution: 'local' | 'server') => void;
  onClose?: () => void;
}

export function SyncConflictModal({ conflict, onResolve, onClose }: SyncConflictModalProps) {
  const local = conflict.localVersion || {};
  const server = conflict.serverVersion || {};

  // Extract changed fields if not explicitly provided
  const changedFields = conflict.changedFields || (() => {
    const keys = Array.from(new Set([...Object.keys(local), ...Object.keys(server)]));
    const ignoredKeys = ['id', 'projectId', 'attachments', 'photos', 'customFields'];
    return keys
      .filter(key => !ignoredKeys.includes(key))
      .filter(key => JSON.stringify(local[key]) !== JSON.stringify(server[key]))
      .map(key => ({
        fieldName: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        localValue: local[key] ?? '—',
        serverValue: server[key] ?? '—'
      }));
  })();

  const formatVal = (val: any) => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 flex justify-between items-start gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Data Sync Conflict Detected
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Action Required
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Changes were saved locally on this device, but a conflicting version was updated on the server. Please select which version to preserve.
              </p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Conflict Overview Card */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Layers className="h-4 w-4 text-[#0B5FFF]" />
            <span className="font-semibold text-slate-500">Target Item:</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold uppercase text-[10px]">
              {conflict.entityType}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{conflict.entityId}</span>
            <span>—</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{conflict.entityName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Detected: {conflict.timestamp}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LOCAL DEVICE CARD */}
            <div className="p-5 rounded-2xl border-2 border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-500/40 flex flex-col justify-between gap-4 transition-all hover:border-blue-500/60 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500 text-white shadow-sm">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Local Device Version</h4>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Saved on this browser session</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                    THIS DEVICE
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{formatVal(local.status || local.state)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Progress / Output</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {local.progress !== undefined ? `${local.progress}%` : local.actualQuantity !== undefined ? `${local.actualQuantity} ${local.unit || ''}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Last Modified</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{formatVal(local.updatedAt || local.date || 'Recent')}</span>
                  </div>
                  {local.supervisor && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Supervisor</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatVal(local.supervisor)}</span>
                    </div>
                  )}
                  {local.remarks && (
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium block mb-0.5">Remarks / Notes</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2">{formatVal(local.remarks || local.summary)}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onResolve('local')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Check className="h-4 w-4" />
                Keep Local Version
              </button>
            </div>

            {/* CLOUD SERVER CARD */}
            <div className="p-5 rounded-2xl border-2 border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 dark:border-purple-500/40 flex flex-col justify-between gap-4 transition-all hover:border-purple-500/60 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-sm">
                      <Cloud className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cloud Server Version</h4>
                      <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">Received from Firebase / Server</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                    CLOUD SERVER
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-bold text-purple-700 dark:text-purple-400">{formatVal(server.status || server.state)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Progress / Output</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {server.progress !== undefined ? `${server.progress}%` : server.actualQuantity !== undefined ? `${server.actualQuantity} ${server.unit || ''}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 font-medium">Last Modified</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{formatVal(server.updatedAt || server.date || 'Recent')}</span>
                  </div>
                  {server.supervisor && (
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-medium">Supervisor</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatVal(server.supervisor)}</span>
                    </div>
                  )}
                  {server.remarks && (
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium block mb-0.5">Remarks / Notes</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2">{formatVal(server.remarks || server.summary)}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onResolve('server')}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <Cloud className="h-4 w-4" />
                Keep Server Version
              </button>
            </div>

          </div>

          {/* Field-by-Field Diff Table */}
          {changedFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <GitCompare className="h-4 w-4 text-[#0B5FFF]" /> Conflicting Field Comparison ({changedFields.length})
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Field</th>
                      <th className="py-2.5 px-4 text-blue-700 dark:text-blue-400">Local Version Value</th>
                      <th className="py-2.5 px-4 text-purple-700 dark:text-purple-400">Server Version Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {changedFields.map((field, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {field.label}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-blue-800 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">
                          {formatVal(field.localValue)}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-purple-800 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20">
                          {formatVal(field.serverValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecting a version will overwrite the other in both local IndexedDB and cloud database.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onResolve('local')}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5 text-blue-600" />
              Use Local Version
            </button>
            <button
              onClick={() => onResolve('server')}
              className="px-4 py-2 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Cloud className="h-3.5 w-3.5" />
              Use Server Version
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
