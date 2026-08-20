import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  FileJson,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  HelpCircle,
  Info,
  Calendar,
  User,
  Activity,
  FileText,
  Users,
  Package,
  CheckSquare,
  Truck,
  Home,
  Compass,
  FolderOpen,
  Settings,
  ArrowRight,
  RotateCcw,
  FileCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import {
  APP_SECTIONS,
  AppSectionKey,
  getLiveSectionCounts,
  createExportArchive,
  inspectArchiveFile,
  executeRestore,
  ArchiveManifest,
  PlainArchivePackage,
  RestoreStrategy
} from '../lib/dataArchiveService';
import { saveOrShareFile } from '../lib/fileExportService';
import { useAppContext } from '../context/AppContext';

export interface DataMigrationEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'export' | 'restore';
  currentUserProfile?: { name?: string; role?: string } | null;
}

const SECTION_ICONS: Record<AppSectionKey, React.ComponentType<{ className?: string }>> = {
  activities: Activity,
  reports: FileText,
  labour: Users,
  materials: Package,
  safety: ShieldCheck,
  quality: CheckSquare,
  equipment: Truck,
  accommodation: Home,
  surveys: Compass,
  documents: FolderOpen,
  settings: Settings
};

export function DataMigrationEngineModal({
  isOpen,
  onClose,
  initialTab = 'export',
  currentUserProfile
}: DataMigrationEngineModalProps) {
  const { restoreFromArchivePackage } = useAppContext();
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>(initialTab);
  const [liveCounts, setLiveCounts] = useState<Record<AppSectionKey, number>>({} as any);

  // --------------------------------------------------------------------------
  // Export State
  // --------------------------------------------------------------------------
  const allSectionKeys = useMemo(() => Object.keys(APP_SECTIONS) as AppSectionKey[], []);
  const [selectedExportSections, setSelectedExportSections] = useState<AppSectionKey[]>(allSectionKeys);
  const [exportLabel, setExportLabel] = useState<string>('Full Project Operational Backup');
  const [exportNotes, setExportNotes] = useState<string>('');
  const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordHint, setPasswordHint] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [includeBinaryAttachments, setIncludeBinaryAttachments] = useState<boolean>(true);
  const [binaryStats, setBinaryStats] = useState<{ count: number; totalBytes: number }>({ count: 0, totalBytes: 0 });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Restore State
  // --------------------------------------------------------------------------
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isInspectLoading, setIsInspectLoading] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [unlockedArchive, setUnlockedArchive] = useState<PlainArchivePackage | null>(null);
  const [archiveManifest, setArchiveManifest] = useState<ArchiveManifest | null>(null);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [decryptPassword, setDecryptPassword] = useState<string>('');
  const [showDecryptPassword, setShowDecryptPassword] = useState<boolean>(false);
  const [selectedRestoreSections, setSelectedRestoreSections] = useState<AppSectionKey[]>([]);
  const [restoreStrategy, setRestoreStrategy] = useState<RestoreStrategy>('merge');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccessReport, setRestoreSuccessReport] = useState<{
    message: string;
    sections: AppSectionKey[];
    count: number;
    strategy: RestoreStrategy;
  } | null>(null);

  const fileDropRef = useRef<HTMLInputElement>(null);

  // Load live counts and binary storage stats when modal opens
  useEffect(() => {
    if (isOpen) {
      getLiveSectionCounts().then(setLiveCounts).catch(console.error);
      import('../lib/documentStorage').then(mod => {
        mod.getTotalDocumentBinarySize().then(setBinaryStats).catch(console.error);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Password strength calculator
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 25;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 25;
    return score;
  }, [password]);

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Total records selected for export
  const totalSelectedExportRecords = useMemo(() => {
    return selectedExportSections.reduce((sum, key) => sum + (liveCounts[key] || 0), 0);
  }, [selectedExportSections, liveCounts]);

  // Preset Handlers
  const handleApplyPreset = (preset: 'all' | 'field' | 'workforce' | 'inventory') => {
    if (preset === 'all') {
      setSelectedExportSections(allSectionKeys);
      setExportLabel('Full Project Operational Backup');
    } else if (preset === 'field') {
      setSelectedExportSections(['activities', 'reports', 'quality', 'safety', 'surveys']);
      setExportLabel('Field, QA & Daily Logs Snapshot');
    } else if (preset === 'workforce') {
      setSelectedExportSections(['labour', 'accommodation']);
      setExportLabel('Workforce Roster & Camp Hub Backup');
    } else if (preset === 'inventory') {
      setSelectedExportSections(['materials', 'equipment']);
      setExportLabel('Materials Inventory & Plant Machinery Backup');
    }
  };

  const handleToggleExportSection = (key: AppSectionKey) => {
    setSelectedExportSections(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleToggleRestoreSection = (key: AppSectionKey) => {
    setSelectedRestoreSections(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // --------------------------------------------------------------------------
  // Execute Export
  // --------------------------------------------------------------------------
  const handleRunExport = async () => {
    if (selectedExportSections.length === 0) {
      alert('Please select at least one section to export.');
      return;
    }

    if (isPasswordProtected) {
      if (!password || password.length < 4) {
        alert('Password must be at least 4 characters.');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match. Please re-type your confirmation password.');
        return;
      }
    }

    setIsExporting(true);
    setExportSuccessMsg(null);

    try {
      const author = currentUserProfile?.name 
        ? `${currentUserProfile.name} (${currentUserProfile.role || 'Admin'})`
        : 'Constructfield User';

      const { packageString, filename, manifest } = await createExportArchive({
        selectedSections: selectedExportSections,
        label: exportLabel,
        notes: exportNotes,
        exportedBy: author,
        password: isPasswordProtected ? password : undefined,
        passwordHint: isPasswordProtected ? passwordHint : undefined,
        includeBinaryAttachments: selectedExportSections.includes('documents') ? includeBinaryAttachments : false
      });

      const blob = new Blob([packageString], { type: 'application/json' });
      await saveOrShareFile({
        filename,
        blob,
        title: manifest.label,
        text: `Constructfield Archive (${manifest.sections.length} sections, ${manifest.totalRecords} records)`
      });

      setExportSuccessMsg(`Successfully generated and downloaded "${filename}"!`);
      setTimeout(() => setExportSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // --------------------------------------------------------------------------
  // File Inspection & Decryption
  // --------------------------------------------------------------------------
  const handleFileSelected = async (file: File) => {
    setIsInspectLoading(true);
    setInspectError(null);
    setUnlockedArchive(null);
    setArchiveManifest(null);
    setNeedsPassword(false);
    setUploadedFileName(file.name);
    setRestoreSuccessReport(null);

    try {
      const content = await file.text();
      setUploadedFileContent(content);

      const inspection = await inspectArchiveFile(content);

      if (!inspection.valid) {
        setInspectError(inspection.error || 'Invalid or unrecognized archive file.');
        setIsInspectLoading(false);
        return;
      }

      if (inspection.needsPassword) {
        setNeedsPassword(true);
        setArchiveManifest(inspection.manifest || null);
        setIsInspectLoading(false);
        return;
      }

      if (inspection.unlockedData) {
        setUnlockedArchive(inspection.unlockedData);
        setArchiveManifest(inspection.manifest || inspection.unlockedData.manifest);
        // Pre-select all available sections from archive
        const available = inspection.unlockedData.manifest.sections || [];
        setSelectedRestoreSections(available);
      }
    } catch (err: any) {
      console.error('File load error:', err);
      setInspectError('Failed to read file: ' + (err.message || 'Corrupted file'));
    } finally {
      setIsInspectLoading(false);
    }
  };

  const handleUnlockArchive = async () => {
    if (!uploadedFileContent || !decryptPassword) return;
    setIsInspectLoading(true);
    setInspectError(null);

    try {
      const inspection = await inspectArchiveFile(uploadedFileContent, decryptPassword);
      if (inspection.valid && inspection.unlockedData) {
        setNeedsPassword(false);
        setUnlockedArchive(inspection.unlockedData);
        setArchiveManifest(inspection.unlockedData.manifest);
        setSelectedRestoreSections(inspection.unlockedData.manifest.sections || []);
      } else {
        setInspectError(inspection.error || 'Incorrect password for archive.');
      }
    } catch (err: any) {
      setInspectError('Decryption failed: ' + (err.message || 'Invalid password'));
    } finally {
      setIsInspectLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Execute Restore
  // --------------------------------------------------------------------------
  const handleRunRestore = async () => {
    if (!unlockedArchive) return;
    if (selectedRestoreSections.length === 0) {
      alert('Please select at least one section to restore.');
      return;
    }

    const confirmMsg = restoreStrategy === 'replace'
      ? `WARNING: Clean Overwrite will replace existing records for the ${selectedRestoreSections.length} selected section(s). An automatic safety snapshot will be saved. Continue?`
      : `Restoring ${selectedRestoreSections.length} section(s) with Smart Merge (existing records will be preserved & updated). Continue?`;

    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);

    try {
      const result = await restoreFromArchivePackage(unlockedArchive, selectedRestoreSections, restoreStrategy);

      if (result.success) {
        setRestoreSuccessReport({
          message: result.message,
          sections: result.restoredSections,
          count: result.recordsProcessed,
          strategy: result.strategy
        });
      } else {
        alert('Restore failed: ' + (result.error || 'Unknown error occurred.'));
      }
    } catch (err: any) {
      console.error('Restore execution error:', err);
      alert('Restore failed: ' + (err.message || 'Error occurred during data restoration.'));
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#0B5FFF] to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Data Export & Restore Engine
                </h2>
                <Badge className="bg-blue-100 text-[#0B5FFF] dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[10px] hidden sm:inline-flex">
                  AES-256-GCM Encrypted
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Granular module selection, military-grade password encryption, archive inspection & smart merge restoration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('export')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'export'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Download className="h-3.5 w-3.5" /> Export Hub
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('restore')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'restore'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> Restore Hub
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">

          {/* ================================================================ */}
          {/* TAB 1: EXPORT HUB                                                */}
          {/* ================================================================ */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Presets & Selection Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#0B5FFF]" /> Quick Selection Presets
                  </span>
                  <p className="text-[11px] text-slate-500">Choose a recommended preset or pick individual sections below</p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleApplyPreset('all')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedExportSections.length === allSectionKeys.length
                        ? 'bg-[#0B5FFF] text-white border-[#0B5FFF] shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Full Enterprise ({allSectionKeys.length})
                  </button>
                  <button
                    onClick={() => handleApplyPreset('field')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  >
                    Field & QA Logs
                  </button>
                  <button
                    onClick={() => handleApplyPreset('workforce')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  >
                    Workforce & Camps
                  </button>
                  <button
                    onClick={() => handleApplyPreset('inventory')}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  >
                    Inventory & Plant
                  </button>
                  <button
                    onClick={() => setSelectedExportSections([])}
                    className="px-2 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Granular Section Selection Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#0B5FFF]" />
                    Select Sections to Include ({selectedExportSections.length} of {allSectionKeys.length} selected • {totalSelectedExportRecords} records)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allSectionKeys.map(key => {
                    const def = APP_SECTIONS[key];
                    const IconComponent = SECTION_ICONS[key] || Database;
                    const isSelected = selectedExportSections.includes(key);
                    const recordCount = liveCounts[key] || 0;

                    return (
                      <div
                        key={key}
                        onClick={() => handleToggleExportSection(key)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-[#0B5FFF] dark:border-blue-700 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#0B5FFF] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {def.label}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {def.category}
                                </span>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by outer div
                              className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF] h-4 w-4 shrink-0"
                            />
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {def.description}
                          </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-400">Database Records:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            recordCount > 0
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                          }`}>
                            {recordCount} {recordCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Protection & Encryption Panel */}
              <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                      {isPasswordProtected ? <Lock className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        AES-256-GCM Password Encryption
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                          {isPasswordProtected ? '.cfbak (Encrypted)' : '.json (Plain)'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Encrypt your backup file with a password before downloading. Without the password, no one can read or restore it.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPasswordProtected}
                      onChange={e => setIsPasswordProtected(e.target.checked)}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                      Enable Password Protection
                    </span>
                  </label>
                </div>

                {isPasswordProtected && (
                  <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Archive Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Enter strong passphrase"
                          className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              passwordStrength <= 25 ? 'bg-rose-500 w-1/4' :
                              passwordStrength <= 50 ? 'bg-amber-500 w-2/4' :
                              passwordStrength <= 75 ? 'bg-blue-500 w-3/4' :
                              'bg-emerald-500 w-full'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {passwordStrength <= 25 ? 'Weak' : passwordStrength <= 50 ? 'Fair' : passwordStrength <= 75 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter passphrase"
                        className={`w-full h-10 px-3 rounded-xl border bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 ${
                          confirmPassword && !passwordsMatch
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500'
                        }`}
                      />
                      {confirmPassword && (
                        <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {passwordsMatch ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Password Hint (Optional)
                      </label>
                      <input
                        type="text"
                        value={passwordHint}
                        onChange={e => setPasswordHint(e.target.value)}
                        placeholder="e.g. Project Code + Launch Year"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Visible on file inspection to help you remember.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Binary Attachments & PDF Bundling Panel (Active if Documents selected) */}
              {selectedExportSections.includes('documents') && (
                <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Bundle Full Binary Files, PDFs & Blueprints
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                            {binaryStats.count} stored files • {((binaryStats.totalBytes || 0) / 1048576).toFixed(1)} MB
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                          Embeds all raw PDF drawings, blueprints, and inspection attachments inside the archive. This allows the file to be restored <strong>100% offline on any new computer without internet</strong>.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={includeBinaryAttachments}
                        onChange={e => setIncludeBinaryAttachments(e.target.checked)}
                        className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Include Binary Files
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Archive Metadata & Action */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Backup Title / Label
                    </label>
                    <input
                      type="text"
                      value={exportLabel}
                      onChange={e => setExportLabel(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Notes / Description
                    </label>
                    <input
                      type="text"
                      value={exportNotes}
                      onChange={e => setExportNotes(e.target.value)}
                      placeholder="Optional milestone note e.g. Pre-audit snapshot"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>
                </div>

                {exportSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {exportSuccessMsg}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Target Format: <strong className="text-slate-900 dark:text-white font-mono">{isPasswordProtected ? '.cfbak (AES Encrypted Archive)' : '.json (Standard Snapshot)'}</strong>
                  </div>

                  <Button
                    onClick={handleRunExport}
                    disabled={isExporting || selectedExportSections.length === 0 || (isPasswordProtected && (!password || !passwordsMatch))}
                    className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs gap-2 shadow-sm"
                  >
                    {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    {isExporting ? 'Generating Secure Archive...' : `Export Selected Archive (${selectedExportSections.length} Sections • ${totalSelectedExportRecords} Records)`}
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: INSPECT & RESTORE HUB                                     */}
          {/* ================================================================ */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              
              {/* File Upload / Dropzone */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileDropRef}
                  accept=".cfbak,.json,.enc.json"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelected(file);
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => fileDropRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#0B5FFF] dark:hover:border-blue-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
                >
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-[#0B5FFF] flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {uploadedFileName ? `Selected: ${uploadedFileName}` : 'Select or Drop Constructfield Archive File'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">.cfbak</code> (Encrypted), <code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">.json</code> (Plain) and legacy Constructfield backups
                  </p>
                </div>
              </div>

              {/* Inspection Loader */}
              {isInspectLoading && (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#0B5FFF]" />
                  <span>Inspecting archive container and validating cryptography...</span>
                </div>
              )}

              {/* Error Message */}
              {inspectError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{inspectError}</span>
                </div>
              )}

              {/* Password Prompt for Encrypted Archive */}
              {needsPassword && (
                <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
                    <Lock className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold">This Archive is Password-Protected (AES-256-GCM)</h4>
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Please enter the archive passphrase to inspect and restore its contents.
                      </p>
                    </div>
                  </div>

                  {archiveManifest?.hint && (
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span><strong>Password Hint:</strong> {archiveManifest.hint}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type={showDecryptPassword ? 'text' : 'password'}
                        value={decryptPassword}
                        onChange={e => setDecryptPassword(e.target.value)}
                        placeholder="Enter archive passphrase"
                        onKeyDown={e => e.key === 'Enter' && handleUnlockArchive()}
                        className="w-full h-10 px-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400"
                      >
                        {showDecryptPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <Button
                      onClick={handleUnlockArchive}
                      disabled={!decryptPassword || isInspectLoading}
                      className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                    >
                      <Unlock className="h-4 w-4" /> Unlock & Inspect
                    </Button>
                  </div>
                </div>
              )}

              {/* Unlocked Archive Manifest & Inspection Details */}
              {unlockedArchive && archiveManifest && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Manifest Overview Card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {archiveManifest.label || 'Constructfield Archive'}
                          </h4>
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            {archiveManifest.isEncrypted ? 'Encrypted Container Verified' : 'Standard Archive Verified'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Exported by <strong>{archiveManifest.exportedBy}</strong> on {new Date(archiveManifest.exportDate).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        Total Records in File: <strong className="text-slate-900 dark:text-white font-mono">{archiveManifest.totalRecords}</strong>
                      </div>
                    </div>

                    {archiveManifest.hasBinaryAttachments && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span><strong>Air-Gapped Standalone Archive:</strong> Includes {archiveManifest.binaryAttachmentsCount || 0} PDF & CAD drawings ({((archiveManifest.binaryAttachmentsBytes || 0) / 1048576).toFixed(1)} MB).</span>
                        </div>
                        <span className="font-bold text-[10px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          Offline Restorable
                        </span>
                      </div>
                    )}

                    {archiveManifest.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        "{archiveManifest.notes}"
                      </p>
                    )}
                  </div>

                  {/* Selective Section Checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4 text-[#0B5FFF]" />
                        Select Sections to Restore ({selectedRestoreSections.length} of {archiveManifest.sections.length} selected)
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedRestoreSections(archiveManifest.sections)}
                          className="text-[11px] font-bold text-[#0B5FFF] hover:underline"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          onClick={() => setSelectedRestoreSections([])}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {archiveManifest.sections.map(key => {
                        const def = APP_SECTIONS[key] || { label: key, category: 'General', description: '' };
                        const IconComponent = SECTION_ICONS[key] || Database;
                        const isSelected = selectedRestoreSections.includes(key);
                        const incomingCount = archiveManifest.sectionCounts[key] || 0;
                        const currentCount = liveCounts[key] || 0;

                        return (
                          <div
                            key={key}
                            onClick={() => handleToggleRestoreSection(key)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all select-none ${
                              isSelected
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                    {def.label}
                                  </h4>
                                  <span className="text-[10px] text-slate-400">
                                    {def.category}
                                  </span>
                                </div>
                              </div>

                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                            </div>

                            <div className="text-[11px] text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="flex justify-between">
                                <span>Incoming in file:</span>
                                <strong className="font-mono text-emerald-700 dark:text-emerald-400">{incomingCount} items</strong>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>Current local DB:</span>
                                <span className="font-mono">{currentCount} items</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Restore Strategy Selector */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="h-4 w-4 text-[#0B5FFF]" />
                      Restoration Strategy
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRestoreStrategy('merge')}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          restoreStrategy === 'merge'
                            ? 'border-[#0B5FFF] bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Smart Merge & Upsert (Recommended)</span>
                          {restoreStrategy === 'merge' && <Check className="h-4 w-4 text-[#0B5FFF]" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Keeps all existing records and safely merges/updates new records by ID. Zero risk of data loss.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRestoreStrategy('replace')}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          restoreStrategy === 'replace'
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 shadow-2xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Clean Overwrite (Section Replace)</span>
                          {restoreStrategy === 'replace' && <Check className="h-4 w-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Completely replaces the selected section tables with the imported file. Other unselected sections remain untouched.
                        </p>
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>An automatic safety snapshot of your current database will be saved before restoring.</span>
                    </div>
                  </div>

                  {/* Success Result Report */}
                  {restoreSuccessReport && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span>Restoration Completed Successfully!</span>
                      </div>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300">
                        {restoreSuccessReport.message} All records have been live-applied to your workspace.
                      </p>
                      <div className="pt-2 flex items-center gap-2">
                        <Button
                          onClick={onClose}
                          className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                        >
                          <Check className="h-3.5 w-3.5" /> Done & View Workspace
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.location.reload()}
                          className="h-8 px-3 rounded-xl text-xs border-emerald-300 text-emerald-800 dark:text-emerald-300"
                        >
                          <RotateCcw className="h-3 w-3" /> Reload Page
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Restore Action Button */}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setUnlockedArchive(null);
                        setArchiveManifest(null);
                        setUploadedFileContent(null);
                      }}
                      variant="outline"
                      className="h-11 px-4 rounded-xl text-xs font-semibold"
                    >
                      Cancel / Select Another File
                    </Button>

                    <Button
                      onClick={handleRunRestore}
                      disabled={isRestoring || selectedRestoreSections.length === 0}
                      className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-sm"
                    >
                      {isRestoring ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isRestoring ? 'Restoring Selected Sections...' : `Restore ${selectedRestoreSections.length} Section(s) Now`}
                    </Button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
