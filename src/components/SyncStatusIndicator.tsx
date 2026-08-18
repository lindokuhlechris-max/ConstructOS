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
  Loader2,
  Key,
  ExternalLink,
  Copy,
  X,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { GoogleDriveService } from '../services/GoogleDriveService';
import { DataMigrationEngineModal } from './DataMigrationEngineModal';

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
  
  // Advanced Migration Engine Modal State
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [migrationTab, setMigrationTab] = useState<'export' | 'restore'>('export');

  // Google Drive Setup Modal State
  const [isDriveSetupModalOpen, setIsDriveSetupModalOpen] = useState(false);
  const [inputClientId, setInputClientId] = useState(() => GoogleDriveService.getClientId());
  const [clientIdCopied, setClientIdCopied] = useState(false);
  const [originCopied, setOriginCopied] = useState(false);

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
    const currentId = GoogleDriveService.getClientId();
    if (!GoogleDriveService.isClientIdValid(currentId)) {
      setIsDriveSetupModalOpen(true);
      return;
    }

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

      const driveService = new GoogleDriveService();
      await driveService.writeData(backupData, 'constructfield_data.json', setDriveStatus);

      setBackupMsg('Google Drive backup successful!');
      setTimeout(() => setBackupMsg(null), 3500);
    } catch (err: any) {
      console.error('Google Drive backup error:', err);
      const msg = err.message || '';
      if (msg.includes('401') || msg.includes('invalid_client') || msg.includes('Client ID')) {
        setIsDriveSetupModalOpen(true);
      } else {
        setBackupMsg('Drive Error: ' + msg);
        setTimeout(() => setBackupMsg(null), 5000);
      }
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const handleSaveClientIdAndRetry = async () => {
    GoogleDriveService.saveClientId(inputClientId);
    setIsDriveSetupModalOpen(false);
    if (GoogleDriveService.isClientIdValid(inputClientId)) {
      handleDriveBackup();
    }
  };

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setOriginCopied(true);
    setTimeout(() => setOriginCopied(false), 2000);
  };

  const handleOpenExportEngine = () => {
    setMigrationTab('export');
    setIsMigrationModalOpen(true);
    setIsOpen(false);
  };

  const handleOpenRestoreEngine = () => {
    setMigrationTab('restore');
    setIsMigrationModalOpen(true);
    setIsOpen(false);
  };

  const formatLastSynced = () => {
    if (!lastSyncedAt) return 'Never';
    const diff = Math.floor((Date.now() - lastSyncedAt.getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Main Topbar Indicator Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-xs ${
          isOffline
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
            : isSyncing || isManualSyncing
            ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] dark:text-blue-300 border-blue-300 dark:border-blue-800'
            : hasPendingChanges && isManualSyncMode
            ? 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
        }`}
        title="Database Synchronization & Backup Hub"
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            <span className="hidden sm:inline">Offline Mode</span>
          </>
        ) : isSyncing || isManualSyncing ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0B5FFF]" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        ) : hasPendingChanges && isManualSyncMode ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="hidden sm:inline">{pendingChangesCount} Pending Sync</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Synced</span>
          </>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#0B5FFF]" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sync & Backup Hub
              </h4>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleManualSync}
              disabled={isOffline || isSyncing || isManualSyncing}
              className="py-2.5 px-3 rounded-xl bg-[#0B5FFF] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              title="Upload and mirror state to Firebase Cloud"
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

          {/* ADVANCED GRANULAR & ENCRYPTED EXPORT/RESTORE ENGINE BANNER */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0B5FFF]" />
                Granular & Encrypted Backups
              </span>
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                AES-256
              </span>
            </div>

            {/* Main Launcher Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col gap-2.5 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" />
                    Data Migration & Export Engine
                  </h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Select specific modules to export, protect archives with passwords, and inspect files before smart restoring.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleOpenExportEngine}
                  className="py-2 px-3 rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Download className="h-3.5 w-3.5" /> Selective Export
                </button>

                <button
                  onClick={handleOpenRestoreEngine}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <Upload className="h-3.5 w-3.5" /> Smart Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE SETUP & TROUBLESHOOTING MODAL */}
      {isDriveSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                  <CloudUpload className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Google Drive Backup Setup
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fix "Error 401: invalid_client" & Configure OAuth
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDriveSetupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Alert notice explaining Error 401 */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  Why Google showed "Error 401: invalid_client"
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Google Drive requires a registered Google Cloud OAuth 2.0 Web Client ID with your current origin authorized to grant secure cloud storage access.
                </p>
              </div>

              {/* 3 Step Setup Guide */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  How to setup in 2 minutes:
                </h4>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Open Google Cloud Console</p>
                      <p className="text-[11px] text-slate-500">Go to APIs & Services → Credentials, then click <strong>Create Credentials → OAuth client ID</strong> (Type: <em>Web application</em>).</p>
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold"
                      >
                        Open Google Cloud Credentials <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Add Authorized JavaScript Origin</p>
                      <p className="text-[11px] text-slate-500">Under <em>Authorized JavaScript origins</em>, add your current URL:</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded text-[11px] font-mono text-slate-800 dark:text-slate-200 select-all">
                          {window.location.origin}
                        </code>
                        <button
                          onClick={handleCopyOrigin}
                          className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1 border border-indigo-200"
                        >
                          <Copy className="h-3 w-3" /> {originCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">Paste Client ID below</p>
                      <p className="text-[11px] text-slate-500">Copy the generated Web Client ID and paste it into the field below.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client ID Input Field */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-indigo-600" />
                  Your Google OAuth Client ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                    value={inputClientId}
                    onChange={e => setInputClientId(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSaveClientIdAndRetry}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
                  >
                    Save & Backup
                  </button>
                </div>
              </div>

              {/* 1-Click Alternative Backups */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Instant Alternative Backups (No Google OAuth required):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsDriveSetupModalOpen(false);
                      handleManualSync();
                    }}
                    className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-left hover:bg-blue-100/50 transition-colors"
                  >
                    <div className="font-bold text-xs text-[#0B5FFF] flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Sync to Cloud
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Firebase real-time cloud storage</div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDriveSetupModalOpen(false);
                      handleOpenExportEngine();
                    }}
                    className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 text-left hover:bg-emerald-100/50 transition-colors"
                  >
                    <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Download className="h-3 w-3" /> Export Archive
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Selective / Encrypted file</div>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setIsDriveSetupModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA MIGRATION & SELECTIVE EXPORT/RESTORE ENGINE MODAL */}
      <DataMigrationEngineModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        initialTab={migrationTab}
        currentUserProfile={currentUserProfile}
      />
    </div>
  );
}
