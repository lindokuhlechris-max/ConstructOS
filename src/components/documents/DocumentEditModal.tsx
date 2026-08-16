import React, { useState, useEffect } from 'react';
import { Button, CustomSelect } from '../ui';
import { X, Edit3, Save, Tag, ShieldAlert, Plus, Link as LinkIcon } from 'lucide-react';
import { Activity, DocumentCategory, DocumentItem, DocumentStatus } from '../../types';

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

export function DocumentEditModal({
  document: doc,
  isOpen,
  onClose,
  onSave,
  activities
}: DocumentEditModalProps) {
  const [title, setTitle] = useState('');
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
      setTitle(doc.title);
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
      title: title.trim() || doc.fileName,
      category,
      status,
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Document Details</h2>
              <p className="text-xs text-slate-500">Update metadata, revision status, or link to a project activity.</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[80vh] overflow-y-auto">
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => setCategory(val as DocumentCategory)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Status
              </label>
              <CustomSelect
                value={status}
                onChange={(val) => setStatus(val as DocumentStatus)}
                options={[
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Under Review', label: 'Under Review' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Archived', label: 'Archived' }
                ]}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Version / Revision
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Assigned Activity
              </label>
              <CustomSelect
                value={linkedActivityId}
                onChange={(val) => setLinkedActivityId(val)}
                options={[
                  { value: '', label: 'None (Unassigned)' },
                  ...activities.map(a => ({
                    value: a.id,
                    label: `${a.name} (${a.status})`
                  }))
                ]}
                className="w-full"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Tags & Keywords
            </label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag and press enter"
                  className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                className="h-10 px-3.5 rounded-xl font-bold text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              Description & Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2.5}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {/* Confidentiality */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="edit-confidential"
              checked={confidential}
              onChange={(e) => setConfidential(e.target.checked)}
              className="h-4 w-4 rounded text-[#0B5FFF] focus:ring-[#0B5FFF] border-slate-300 cursor-pointer"
            />
            <label htmlFor="edit-confidential" className="text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              Mark as Confidential / Restricted Access Document
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-5 py-2 font-semibold text-xs sm:text-sm shadow-sm gap-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
