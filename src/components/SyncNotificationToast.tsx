import React from 'react';
import { RefreshCw, AlertTriangle, CheckCircle2, X, Cloud, WifiOff, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export interface SyncToastState {
  visible: boolean;
  message?: string;
  type?: 'syncing' | 'warning' | 'success' | 'offline' | 'info' | 'error';
}

export function SyncNotificationToast() {
  const { isSyncing, isOffline, lastSyncedAt, forceSyncAll, syncToast, hideSyncToast } = useAppContext();

  if (!syncToast.visible && !isSyncing) {
    return null;
  }

  const toastType = syncToast.type || (isSyncing ? 'syncing' : isOffline ? 'offline' : 'warning');

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 duration-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            toastType === 'syncing'
              ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF]'
              : toastType === 'offline'
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
              : toastType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
              : toastType === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600'
              : toastType === 'info'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
          }`}>
            {toastType === 'syncing' ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : toastType === 'offline' ? (
              <WifiOff className="h-5 w-5" />
            ) : toastType === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : toastType === 'error' ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {toastType === 'syncing' && 'Cloud Syncing Active'}
              {toastType === 'offline' && 'Offline Mode - Queued Edits'}
              {toastType === 'warning' && 'Pending Sync Operation'}
              {toastType === 'success' && 'Operation Successful'}
              {toastType === 'info' && 'System Notice'}
              {toastType === 'error' && 'Action Alert'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {syncToast.message || (
                toastType === 'syncing'
                  ? 'Saving changes to Firebase. Please wait before closing or navigating away from critical screens.'
                  : toastType === 'offline'
                  ? 'Your edits are saved locally and will auto-sync once internet connectivity is restored.'
                  : 'Pending sync operation. Do not close the window to prevent data loss.'
              )}
            </p>

            {/* Quick Action Button */}
            {!isSyncing && !isOffline && (
              <button
                onClick={() => forceSyncAll()}
                className="mt-2 text-[11px] font-semibold text-[#0B5FFF] hover:underline inline-flex items-center gap-1"
              >
                Sync Now <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={hideSyncToast}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
