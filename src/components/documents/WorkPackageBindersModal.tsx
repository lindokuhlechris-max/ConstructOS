import React, { useState, useMemo } from 'react';
import { 
  X, 
  Briefcase, 
  Plus, 
  Layers, 
  Download, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  ChevronRight, 
  FolderArchive, 
  Link as LinkIcon, 
  Check, 
  Loader2,
  HardHat,
  Building2,
  Share2
} from 'lucide-react';
import { WorkPackageBinder, DocumentItem, DocumentDiscipline, Activity } from '../../types';
import { getDocumentFile } from '../../lib/documentStorage';
import { saveOrShareFile } from '../../lib/fileExportService';
import { Button, Badge } from '../ui';
import JSZip from 'jszip';

interface WorkPackageBindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  binders: WorkPackageBinder[];
  documents: DocumentItem[];
  activities: Activity[];
  currentUser: string;
  onAddBinder: (binder: WorkPackageBinder) => void;
  onUpdateBinder: (binder: WorkPackageBinder) => void;
  onDeleteBinder: (id: string) => void;
  onToggleDocInBinder: (binderId: string, docId: string) => void;
  canEdit: boolean;
}

const DISCIPLINES: DocumentDiscipline[] = [
  'Civil',
  'Structural',
  'Electrical & MEP',
  'Mechanical',
  'Geotechnical & Survey',
  'Architectural',
  'HSE & Safety',
  'Commercial & Contracts',
  'General'
];

export function WorkPackageBindersModal({
  isOpen,
  onClose,
  binders,
  documents,
  activities,
  currentUser,
  onAddBinder,
  onUpdateBinder,
  onDeleteBinder,
  onToggleDocInBinder,
  canEdit
}: WorkPackageBindersModalProps) {
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | DocumentDiscipline>('All');
  const [isEditingBinder, setIsEditingBinder] = useState(false);
  const [binderForm, setBinderForm] = useState<Partial<WorkPackageBinder>>({});
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [isCompilingZip, setIsCompilingZip] = useState(false);
  const [compileProgress, setCompileProgress] = useState('');

  const filteredBinders = useMemo(() => {
    return binders.filter(b => {
      if (selectedDiscipline !== 'All' && b.discipline !== selectedDiscipline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${b.title} ${b.code} ${b.discipline} ${b.description || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [binders, selectedDiscipline, searchQuery]);

  const activeBinder = useMemo(() => {
    if (!selectedBinderId && filteredBinders.length > 0) return filteredBinders[0];
    return binders.find(b => b.id === selectedBinderId) || filteredBinders[0] || null;
  }, [selectedBinderId, binders, filteredBinders]);

  const binderDocs = useMemo(() => {
    if (!activeBinder) return [];
    return documents.filter(d => activeBinder.documentIds.includes(d.id));
  }, [activeBinder, documents]);

  if (!isOpen) return null;

  // Open Create Form
  const handleOpenCreate = () => {
    setBinderForm({
      id: `WPB-${Date.now().toString(36).toUpperCase()}`,
      projectId: 'PRJ-001',
      code: `WPB-PAC-${Math.floor(100 + Math.random() * 900)}`,
      title: '',
      discipline: 'Civil',
      status: 'Active On-Site',
      description: '',
      documentIds: [],
      createdDate: new Date().toISOString().slice(0, 10),
      createdBy: currentUser
    });
    setIsEditingBinder(true);
  };

  // Open Edit Form
  const handleOpenEdit = (binder: WorkPackageBinder) => {
    setBinderForm({ ...binder });
    setIsEditingBinder(true);
  };

  const handleSaveBinder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!binderForm.title || !binderForm.code) return;

    const fullBinder: WorkPackageBinder = {
      id: binderForm.id || `WPB-${Date.now().toString(36).toUpperCase()}`,
      projectId: binderForm.projectId || 'PRJ-001',
      code: binderForm.code.trim().toUpperCase(),
      title: binderForm.title.trim(),
      discipline: binderForm.discipline || 'Civil',
      status: binderForm.status || 'Active On-Site',
      description: binderForm.description || '',
      documentIds: binderForm.documentIds || [],
      linkedActivityId: binderForm.linkedActivityId || undefined,
      linkedActivityName: binderForm.linkedActivityName || undefined,
      createdDate: binderForm.createdDate || new Date().toISOString().slice(0, 10),
      createdBy: binderForm.createdBy || currentUser
    };

    if (binders.some(b => b.id === fullBinder.id)) {
      onUpdateBinder(fullBinder);
    } else {
      onAddBinder(fullBinder);
      setSelectedBinderId(fullBinder.id);
    }
    setIsEditingBinder(false);
  };

  // Compile Work Package into a clean ZIP bundle with index manifest
  const handleDownloadDossierZip = async (binder: WorkPackageBinder) => {
    const docs = documents.filter(d => binder.documentIds.includes(d.id));
    if (docs.length === 0) {
      alert('This work package does not contain any attached documents yet.');
      return;
    }

    setIsCompilingZip(true);
    setCompileProgress(`Compiling dossier ${binder.code}...`);

    try {
      const zip = new JSZip();

      // Create manifest index
      let manifestText = `==========================================================\n`;
      manifestText += `CONSTRUCTOS WORK PACKAGE DOSSIER: ${binder.code}\n`;
      manifestText += `TITLE: ${binder.title}\n`;
      manifestText += `DISCIPLINE: ${binder.discipline} | STATUS: ${binder.status}\n`;
      manifestText += `DATE COMPILED: ${new Date().toLocaleString()}\n`;
      manifestText += `COMPILED BY: ${currentUser}\n`;
      manifestText += `TOTAL DRAWINGS/SPECS: ${docs.length}\n`;
      manifestText += `==========================================================\n\n`;
      manifestText += `DOCUMENT REGISTER INDEX:\n`;
      manifestText += `----------------------------------------------------------\n`;
      manifestText += `NO | DOC NUMBER        | REV   | STATUS | TITLE\n`;
      manifestText += `----------------------------------------------------------\n`;

      docs.forEach((d, idx) => {
        manifestText += `${String(idx + 1).padEnd(3)}| ${String(d.documentNumber || d.id).padEnd(18)}| ${String(d.revision || d.version).padEnd(6)}| ${String(d.issueStatus || d.status).padEnd(7)}| ${d.title}\n`;
      });
      manifestText += `----------------------------------------------------------\n`;

      zip.file(`00_DOSSIER_INDEX_MANIFEST.txt`, manifestText);

      // Add attached files
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        setCompileProgress(`Packaging (${i + 1}/${docs.length}): ${doc.fileName}`);
        const record = await getDocumentFile(doc.id);
        if (record && record.blob) {
          zip.file(doc.fileName, record.blob);
        } else if (doc.fileUrl && doc.fileUrl.startsWith('data:')) {
          const base64Data = doc.fileUrl.split(',')[1];
          if (base64Data) {
            zip.file(doc.fileName, base64Data, { base64: true });
          }
        } else {
          zip.file(`${doc.fileName}.txt`, `Document: ${doc.title}\nNumber: ${doc.documentNumber}\nRev: ${doc.revision}`);
        }
      }

      setCompileProgress('Finalizing compressed dossier ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });
      const safeCode = binder.code.replace(/[^a-zA-Z0-9_-]/g, '_');
      saveOrShareFile({
        filename: `${safeCode}_Site_Execution_Dossier.zip`,
        blob: content,
        title: `${binder.code} Work Package Dossier`,
        saveToDownloads: true,
        triggerShare: true
      });

      setIsCompilingZip(false);
      setCompileProgress('');
    } catch (err) {
      console.error('Dossier packaging error:', err);
      alert('Failed to generate dossier package.');
      setIsCompilingZip(false);
      setCompileProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl my-6 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] shadow-xs">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Work Package Binders & Site Dossiers
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {binders.length} Active Binders
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Bundle drawings, specs, method statements, and ITPs for field crews and subcontractors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                onClick={handleOpenCreate}
                className="rounded-xl px-3.5 py-1.5 font-bold text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-sm gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Work Package</span>
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* Left Column: Binders List & Filter */}
          <div className="p-4 flex flex-col justify-between overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-900/40">
            <div className="space-y-2.5">
              {/* Search & Discipline Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search work packages..."
                    className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedDiscipline}
                  onChange={e => setSelectedDiscipline(e.target.value as any)}
                  className="w-full h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="All">All Disciplines</option>
                  {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Binders List */}
              <div className="space-y-2 pt-1">
                {filteredBinders.map(b => {
                  const isSelected = activeBinder?.id === b.id;
                  const docCount = b.documentIds.length;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBinderId(b.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-100/60 dark:bg-blue-900/60 px-1.5 py-0.5 rounded-md">
                          {b.code}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          b.status === 'Active On-Site'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {b.status}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-1">
                        {b.title}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span>{b.discipline}</span>
                        <span className="font-mono font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded-md">
                          {docCount} Files
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (2 cols): Selected Binder Details & Document Roster */}
          <div className="md:col-span-2 p-5 flex flex-col justify-between overflow-y-auto space-y-4">
            {activeBinder ? (
              <div className="space-y-4">
                
                {/* Active Binder Header Card */}
                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#0B5FFF] bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                          {activeBinder.code}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {activeBinder.discipline}
                        </Badge>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {activeBinder.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5">
                        {activeBinder.title}
                      </h3>
                      {activeBinder.description && (
                        <p className="text-xs text-slate-500 mt-1">
                          {activeBinder.description}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(activeBinder)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete Work Package ${activeBinder.code}?`)) {
                              onDeleteBinder(activeBinder.id);
                              setSelectedBinderId(null);
                            }
                          }}
                          className="p-1.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs text-slate-500">
                      <span>Created by {activeBinder.createdBy} on {activeBinder.createdDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDocPickerOpen(true)}
                          className="rounded-xl text-xs font-bold gap-1 bg-white dark:bg-slate-800"
                        >
                          <Layers className="h-3.5 w-3.5 text-blue-500" />
                          <span>Manage Attached Docs ({binderDocs.length})</span>
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleDownloadDossierZip(activeBinder)}
                        disabled={isCompilingZip || binderDocs.length === 0}
                        className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                      >
                        {isCompilingZip ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span>Download Dossier ZIP</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Attached Documents Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span>Attached Work Package Documents ({binderDocs.length})</span>
                  </div>

                  {binderDocs.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-xs text-slate-400">
                      No documents attached to this package yet. Click &quot;Manage Attached Docs&quot; to link drawings, specs, and ITPs.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Doc Number</th>
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Rev</th>
                            <th className="px-3 py-2">Issue Status</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {binderDocs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {doc.documentNumber || doc.id}
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                                {doc.title}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-blue-600">
                                {doc.revision || doc.version}
                              </td>
                              <td className="px-3 py-2 font-bold text-emerald-600">
                                {doc.issueStatus || doc.status}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {canEdit && (
                                  <button
                                    onClick={() => onToggleDocInBinder(activeBinder.id, doc.id)}
                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                  >
                                    Detach
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select or create a work package binder to view details.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Create / Edit Binder Modal */}
      {isEditingBinder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {binderForm.id && binders.some(b => b.id === binderForm.id) ? 'Edit Work Package Dossier' : 'New Work Package Dossier'}
                </h3>
              </div>
              <button onClick={() => setIsEditingBinder(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBinder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Package Code *</label>
                  <input
                    type="text"
                    required
                    value={binderForm.code || ''}
                    onChange={e => setBinderForm({ ...binderForm, code: e.target.value })}
                    placeholder="e.g. WPB-CIV-001"
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Discipline *</label>
                  <select
                    value={binderForm.discipline || 'Civil'}
                    onChange={e => setBinderForm({ ...binderForm, discipline: e.target.value as DocumentDiscipline })}
                    className="w-full h-9 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Package Title *</label>
                <input
                  type="text"
                  required
                  value={binderForm.title || ''}
                  onChange={e => setBinderForm({ ...binderForm, title: e.target.value })}
                  placeholder="e.g. Foundation Concrete & Rebar Pour Pack"
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Status</label>
                <select
                  value={binderForm.status || 'Active On-Site'}
                  onChange={e => setBinderForm({ ...binderForm, status: e.target.value as any })}
                  className="w-full h-9 px-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-700"
                >
                  <option value="Drafting">Drafting</option>
                  <option value="Active On-Site">Active On-Site</option>
                  <option value="Under Revision">Under Revision</option>
                  <option value="Completed">Completed / Handover</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Description / Scope Summary</label>
                <textarea
                  rows={3}
                  value={binderForm.description || ''}
                  onChange={e => setBinderForm({ ...binderForm, description: e.target.value })}
                  placeholder="Describe scope, key milestones, and required drawing sub-sets..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingBinder(false)} className="rounded-xl text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold">
                  Save Work Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Picker Multi-Selector Modal */}
      {isDocPickerOpen && activeBinder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-2xl w-full space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Attach Documents to {activeBinder.code}
                </h3>
              </div>
              <button onClick={() => setIsDocPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {documents.map(doc => {
                const isAttached = activeBinder.documentIds.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    onClick={() => onToggleDocInBinder(activeBinder.id, doc.id)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer rounded-xl transition-colors ${
                      isAttached ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isAttached}
                        onChange={() => {}} // handled by parent div
                        className="rounded text-[#0B5FFF] h-4 w-4"
                      />
                      <div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                          {doc.documentNumber || doc.id} ({doc.revision || doc.version})
                        </div>
                        <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                          {doc.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {doc.discipline || 'General'} • {doc.category}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {doc.issueStatus || doc.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <Button size="sm" onClick={() => setIsDocPickerOpen(false)} className="rounded-xl text-xs bg-[#0B5FFF] text-white font-bold">
                Done ({activeBinder.documentIds.length} Attached)
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
