import React, { useState, useEffect } from 'react';
import { Button, CustomSelect } from '../ui';
import { X, Edit3, Save, Tag, ShieldAlert, Plus, Link as LinkIcon, Layers, FileCheck } from 'lucide-react';
import { Activity, DocumentCategory, DocumentItem, DocumentStatus, DocumentIssueStatus, DocumentDiscipline } from '../../types';

interface DocumentEditModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDoc: DocumentItem) => void;
  activities: Activity[];
}

const CATEGORIES: DocumentCategory[] = [
  'Drawings & Blueprints',
  'Contracts & Agreements',
  'Specifications & Specs',
  'Safety & Compliance',
  'QA/QC Inspections',
  'Financial & Invoices',
  'Material Data Sheets (MSDS)',
  'Daily Logs & Site Records',
  'Method Statements',
  'General'
];

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

const ISSUE_STATUSES: { code: DocumentIssueStatus; label: string }[] = [
  { code: 'IFC', label: 'IFC - Issued For Construction' },
  { code: 'IFA', label: 'IFA - Issued For Approval' },
  { code: 'IFI', label: 'IFI - Issued For Information' },
  { code: 'AB', label: 'AB - As-Built Record' },
  { code: 'TND', label: 'TND - Tender / Bid' },
  { code: 'SUP', label: 'SUP - Superseded / Void' }
];

export function DocumentEditModal({
  document: doc,
  isOpen,
  onClose,
  onSave,
  activities
}: DocumentEditModalProps) {
  const [documentNumber, setDocumentNumber] = useState('');
  const [title, setTitle] = useState('');
  const [revision, setRevision] = useState('Rev 0');
  const [discipline, setDiscipline] = useState<DocumentDiscipline>('Civil');
  const [issueStatus, setIssueStatus] = useState<DocumentIssueStatus>('IFC');
  const [category, setCategory] = useState<DocumentCategory>('Specifications & Specs');
  const [status, setStatus] = useState<DocumentStatus>('Approved');
  const [version, setVersion] = useState('v1.0');
  const [linkedActivityId, setLinkedActivityId] = useState('');
  const [description, setDescription] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (doc) {
      setDocumentNumber(doc.documentNumber || `DOC-${doc.id.slice(-6)}`);
      setTitle(doc.title);
      setRevision(doc.revision || 'Rev 0');
      if (doc.discipline) setDiscipline(doc.discipline as DocumentDiscipline);
      if (doc.issueStatus) setIssueStatus(doc.issueStatus);
      setCategory(doc.category);
      setStatus(doc.status);
      setVersion(doc.version);
      setLinkedActivityId(doc.linkedActivityId || '');
      setDescription(doc.description || '');
      setConfidential(!!doc.confidential);
      setTags(doc.tags || []);
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const linkedActivity = activities.find(a => a.id === linkedActivityId);

    const updated: DocumentItem = {
      ...doc,
      documentNumber: documentNumber.trim() || doc.documentNumber,
      title: title.trim() || doc.fileName,
      revision: revision.trim() || 'Rev 0',
      discipline,
      issueStatus,
      category,
      status: issueStatus === 'SUP' ? 'Superseded' : (issueStatus === 'IFC' ? 'Approved' : status),
      version: version.trim() || 'v1.0',
      linkedActivityId: linkedActivity ? linkedActivity.id : undefined,
      linkedActivityName: linkedActivity ? linkedActivity.name : undefined,
      description: description.trim() || undefined,
      confidential,
      tags,
      lastModified: new Date().toISOString()
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Controlled Document Details</h2>
              <p className="text-xs text-slate-500">Update metadata, revision code, discipline, or issue status.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Document Number / Drawing Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Revision Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Engineering Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value as DocumentDiscipline)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {DISCIPLINES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Issue Status / Purpose
              </label>
              <select
                value={issueStatus}
                onChange={(e) => setIssueStatus(e.target.value as DocumentIssueStatus)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {ISSUE_STATUSES.map(s => (
                  <option key={s.code} value={s.code}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Link to Activity
              </label>
              <select
                value={linkedActivityId}
                onChange={(e) => setLinkedActivityId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              >
                <option value="">-- No Linked Activity --</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.status})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Description / Revision Remarks
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes on scope, revision changes, or specifications..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold gap-1.5 shadow-sm">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}
