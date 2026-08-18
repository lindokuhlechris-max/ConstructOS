import React, { useState, useRef, useEffect } from 'react';
import { 
  Cloud, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  HardDrive, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle,
  Download,
  Upload,
  FileJson,
  Check,
  CloudUpload,
  Loader2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function SyncStatusIndicator() {
  const {
    isSyncing,
    isOffline,
    lastSyncedAt,
    forceSyncAll,
    isManualSyncMode,
    setIsManualSyncMode,
    hasPendingChanges,
    pendingChangesCount,
    theme,
    units,
    currentUserProfile,
    userProfiles,
    customFieldDefinitions
  } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveStatus, setDriveStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    setSyncSuccessMsg(false);
    try {
      await forceSyncAll();
      setSyncSuccessMsg(true);
      setTimeout(() => setSyncSuccessMsg(false), 3000);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Google Drive Cloud Backup
  const handleDriveBackup = async () => {
    try {
      setIsDriveSyncing(true);
      let idbData: any = {};
      try {
        const { getAllIDBData } = await import('../lib/idbService');
        idbData = await getAllIDBData();
      } catch (e) {
        console.warn('IDB state fetch skipped in export:', e);
      }

      const backupData = {
        app: 'Constructfield',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        theme,
        units,
        currentUserProfile,
        userProfiles,
        customFieldDefinitions,
        storage: { ...localStorage },
        idbData
      };

      const { GoogleDriveService } = await import('../services/GoogleDriveService');
      const driveService = new GoogleDriveService();
      await driveService.writeData(backupData, 'constructfield_data.json', setDriveStatus);

      setBackupMsg('Google Drive backup successful!');
      setTimeout(() => setBackupMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      setBackupMsg('Drive Error: ' + (err.message || 'Check Google client settings'));
      setTimeout(() => setBackupMsg(null), 5000);
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Export Local JSON Backup
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      let idbData: any = {};
      try {
        const { getAllIDBData } = await import('../lib/idbService');
        idbData = await getAllIDBData();
      } catch (e) {
        console.warn('IDB state fetch skipped in export:', e);
      }

      const backupData = {
        app: 'Constructfield',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        theme,
        units,
        currentUserProfile,
        userProfiles,
        customFieldDefinitions,
        storage: { ...localStorage },
        idbData
      };

      const { exportJsonFile } = await import('../lib/fileExportService');
      const filename = `constructfield-backup-${new Date().toISOString().split('T')[0]}.json`;
      await exportJsonFile(backupData, filename, 'Constructfield Offline Backup');
      setBackupMsg('Backup exported successfully!');
      setTimeout(() => setBackupMsg(null), 3500);
    } catch (err: any) {
      console.error(err);
      alert('Error creating backup: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // Restore Local JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.storage || imported.idbData) {
            if (imported.storage) {
              Object.keys(imported.storage).forEach(key => {
                localStorage.setItem(key, imported.storage[key]);
              });
            }
            if (imported.idbData) {
              try {
                const { saveFullFirestoreState } = await import('../lib/firestoreService');
                await saveFullFirestoreState(imported.idbData);
              } catch (err) {
                console.warn('IDB restore warning:', err);
              }
            }
            alert('System backup restored successfully! Reloading application...');
            window.location.reload();
          } else {
            alert('Invalid backup format. File does not contain Constructfield data.');
          }
        } catch (err) {
          alert('Failed to parse backup JSON file. Please ensure it is a valid Constructfield JSON backup file.');
        }
      };
      reader.readAsText(file);
    }
    // Reset file input value so same file can be re-selected if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const formatLastSynced = () => {
    if (!lastSyncedAt) return 'Pending...';
    const secondsAgo = Math.floor((new Date().getTime() - new Date(lastSyncedAt).getTime()) / 1000);
    if (secondsAgo < 10) return 'Just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minsAgo = Math.floor(secondsAgo / 60);
    if (minsAgo < 60) return `${minsAgo}m ago`;
    return new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Hidden File Input for Restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportBackup}
        className="hidden"
      />

      {/* Header Badge Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border relative ${
          isOffline
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
            : isSyncing || isManualSyncing
            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50 hover:bg-blue-100'
            : hasPendingChanges
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50 hover:bg-amber-100'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
        }`}
        title={
          isOffline
            ? 'Offline Mode (Saved Locally)'
            : isSyncing || isManualSyncing
            ? 'Syncing to Cloud...'
            : hasPendingChanges
            ? `${pendingChangesCount} Pending Changes (Manual Sync Mode)`
            : 'Manual Sync Active (Synced)'
        }
      >
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
        ) : isSyncing || isManualSyncing ? (
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
        ) : (
          <div className="relative flex items-center justify-center">
            {hasPendingChanges ? (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-white dark:border-slate-900"></span>
              </span>
            ) : (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
            <Cloud className={`h-4 w-4 ${hasPendingChanges ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Database Sync Manager</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Firebase Cloud & IndexedDB</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isOffline
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {isOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>

          {/* Sync Mode Switch Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[#0B5FFF]" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {isManualSyncMode ? 'Manual Sync Mode' : 'Auto Sync Mode'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isManualSyncMode ? 'Edits stored locally until manually synced' : 'Live background updates enabled'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsManualSyncMode(!isManualSyncMode)}
              className="p-1 rounded-lg text-slate-600 hover:text-[#0B5FFF] dark:text-slate-300 transition-colors"
              title="Toggle sync mode"
            >
              {isManualSyncMode ? (
                <ToggleLeft className="h-6 w-6 text-amber-500" />
              ) : (
                <ToggleRight className="h-6 w-6 text-emerald-500" />
              )}
            </button>
          </div>

          {/* Pending Changes Callout */}
          {hasPendingChanges && isManualSyncMode && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{pendingChangesCount} local edit{pendingChangesCount === 1 ? '' : 's'} pending sync</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                Unsynced
              </span>
            </div>
          )}

          {/* Network & Persistence Status Box */}
          <div className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                {isOffline ? (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                ) : (
                  <Cloud className="h-4 w-4 text-[#0B5FFF]" />
                )}
                Network Connectivity
              </span>
              <span className={`font-bold ${isOffline ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isOffline ? 'Disconnected' : 'Connected'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-slate-400" />
                Last Cloud Sync
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatLastSynced()}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isManualSyncMode
              ? 'Local-first manual sync enabled. All site logs, report entries, and project changes are immediately saved locally to IndexedDB/localStorage. Click "Sync Now" below whenever you are ready to send your changes to the cloud.'
              : 'Auto sync enabled. All changes automatically replicate to Firebase Firestore in real time.'}
          </p>

          {syncSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              All local changes successfully synchronized to Cloud!
            </div>
          )}

          {backupMsg && (
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              {backupMsg}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleManualSync}
              disabled={isOffline || isSyncing || isManualSyncing}
              className="py-2.5 px-3 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              title="Upload and mirror state to Firebase Cloud and Server"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              {isManualSyncing ? 'Syncing...' : 'Sync to Cloud'}
            </button>

            <button
              onClick={handleDriveBackup}
              disabled={isDriveSyncing}
              className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              title="Backup full database to Google Drive"
            >
              {isDriveSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
              {isDriveSyncing ? 'Backing up...' : 'Backup to Drive'}
            </button>
          </div>

          {/* LOCAL DEVICE BACKUP SECTION */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Local Device Offline Backup
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <FileJson className="h-3 w-3" /> JSON Snapshot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Export JSON Card */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-2 hover:border-blue-300 dark:hover:border-blue-800 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-[#0B5FFF] shrink-0 mt-0.5">
                    <Download className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Export JSON</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Download full offline data snapshot
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-600 text-[#0B5FFF] dark:text-blue-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-blue-300"
                >
                  <Download className={`h-3 w-3 ${isExporting ? 'animate-bounce' : ''}`} />
                  {isExporting ? 'Exporting...' : 'Export Local File'}
                </button>
              </div>

              {/* Restore JSON Card */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-2 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Upload className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">Restore JSON</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Restore database from saved .JSON
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:border-emerald-300"
                >
                  <Upload className="h-3 w-3" />
                  Select JSON File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

