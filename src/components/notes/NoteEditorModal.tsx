import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Tag, 
  Paperclip, 
  User, 
  Truck, 
  ClipboardList, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Layers, 
  Bold, 
  Italic, 
  List, 
  CheckCircle2, 
  Sparkles, 
  Bell, 
  Calendar,
  AlertTriangle,
  BookOpen,
  Eye,
  Users,
  Cpu,
  ShieldCheck,
  Package,
  HelpCircle,
  StickyNote,
  Palette
} from 'lucide-react';
import { Button } from '../ui';
import { ActivityNote, NoteCategory, NoteColor, NotePriority, NoteChecklistItem } from '../../types';
import { useAppContext } from '../../context/AppContext';

export interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: ActivityNote | null;
  onSave: (note: ActivityNote) => void;
  onConvertToReminder?: (note: ActivityNote) => void;
  defaultCategory?: NoteCategory;
}

const CATEGORIES: { value: NoteCategory; label: string; icon: any; color: string }[] = [
  { value: 'Site Diary', label: 'Site Diary', icon: BookOpen, color: 'text-blue-600' },
  { value: 'Site Observation', label: 'Site Observation', icon: Eye, color: 'text-amber-600' },
  { value: 'Meeting Minutes', label: 'Meeting Minutes', icon: Users, color: 'text-indigo-600' },
  { value: 'Technical Memo', label: 'Technical Memo', icon: Cpu, color: 'text-purple-600' },
  { value: 'QA & Inspection', label: 'QA & Inspection', icon: ShieldCheck, color: 'text-teal-600' },
  { value: 'Safety & Risk', label: 'Safety & Risk', icon: AlertTriangle, color: 'text-rose-600' },
  { value: 'Materials & Delivery', label: 'Materials & Delivery', icon: Package, color: 'text-orange-600' },
  { value: 'Engineering Query', label: 'Engineering Query', icon: HelpCircle, color: 'text-cyan-600' },
  { value: 'General', label: 'General Memo', icon: StickyNote, color: 'text-slate-600' }
];

const COLORS: { value: NoteColor; label: string; bgClass: string; borderClass: string }[] = [
  { value: 'default', label: 'Neutral', bgClass: 'bg-slate-100 dark:bg-slate-800', borderClass: 'border-slate-300' },
  { value: 'blue', label: 'Sky Blue', bgClass: 'bg-blue-100 dark:bg-blue-900', borderClass: 'border-blue-400' },
  { value: 'amber', label: 'Warm Amber', bgClass: 'bg-amber-100 dark:bg-amber-900', borderClass: 'border-amber-400' },
  { value: 'emerald', label: 'Mint Emerald', bgClass: 'bg-emerald-100 dark:bg-emerald-900', borderClass: 'border-emerald-400' },
  { value: 'rose', label: 'Soft Rose', bgClass: 'bg-rose-100 dark:bg-rose-900', borderClass: 'border-rose-400' },
  { value: 'purple', label: 'Violet Purple', bgClass: 'bg-purple-100 dark:bg-purple-900', borderClass: 'border-purple-400' },
  { value: 'indigo', label: 'Deep Indigo', bgClass: 'bg-indigo-100 dark:bg-indigo-900', borderClass: 'border-indigo-400' },
  { value: 'cyan', label: 'Cyan Ocean', bgClass: 'bg-cyan-100 dark:bg-cyan-900', borderClass: 'border-cyan-400' },
  { value: 'slate', label: 'Steel Slate', bgClass: 'bg-slate-200 dark:bg-slate-700', borderClass: 'border-slate-400' }
];

export function NoteEditorModal({
  isOpen,
  onClose,
  noteToEdit,
  onSave,
  onConvertToReminder,
  defaultCategory = 'General'
}: NoteEditorModalProps) {
  const { 
    projects = [], 
    activities = [], 
    employees = [], 
    equipment = [], 
    currentUserProfile 
  } = useAppContext();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>(defaultCategory);
  const [priority, setPriority] = useState<NotePriority>('Medium');
  const [color, setColor] = useState<NoteColor>('default');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Entity Linking
  const [projectId, setProjectId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title || '');
        setContent(noteToEdit.content || '');
        setCategory(noteToEdit.category || 'General');
        setPriority(noteToEdit.priority || 'Medium');
        setColor(noteToEdit.color || 'default');
        setTags(noteToEdit.tags || []);
        setChecklists(noteToEdit.checklists || []);
        setProjectId(noteToEdit.projectId || '');
        setActivityId(noteToEdit.activityId || '');
        setEmployeeId(noteToEdit.linkedEmployeeId || '');
        setEquipmentId(noteToEdit.linkedEquipmentId || '');
        setAttachments([...(noteToEdit.photos || []), ...(noteToEdit.attachments || [])]);
      } else {
        setTitle('');
        setContent('');
        setCategory(defaultCategory);
        setPriority('Medium');
        setColor('default');
        setTags([]);
        setChecklists([]);
        setProjectId(projects[0]?.id || '');
        setActivityId('');
        setEmployeeId('');
        setEquipmentId('');
        setAttachments([]);
      }
      setTagInput('');
      setNewChecklistText('');
    }
  }, [isOpen, noteToEdit, defaultCategory, projects]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newChecklistText.trim(),
      completed: false
    };
    setChecklists([...checklists, newItem]);
    setNewChecklistText('');
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklists(checklists.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklists(checklists.filter(c => c.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) {
          setAttachments(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Text Formatter Helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const nextContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(nextContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 50);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a note title.');
      return;
    }

    const linkedAct = activities.find(a => a.id === activityId);

    const notePayload: ActivityNote = {
      id: noteToEdit?.id || `NOTE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      color,
      tags,
      checklists,
      projectId: projectId || undefined,
      activityId: activityId || undefined,
      activityName: linkedAct?.name || undefined,
      linkedEmployeeId: employeeId || undefined,
      linkedEquipmentId: equipmentId || undefined,
      linkedReminderId: noteToEdit?.linkedReminderId || undefined,
      attachments,
      photos: attachments.filter(a => a.startsWith('data:image/') || a.startsWith('http')),
      isPinned: noteToEdit?.isPinned || false,
      isArchived: noteToEdit?.isArchived || false,
      author: noteToEdit?.author || currentUserProfile?.name || 'Site Engineer',
      authorRole: noteToEdit?.authorRole || currentUserProfile?.role || 'Staff',
      authorInitials: (noteToEdit?.author || currentUserProfile?.name || 'SE').slice(0, 2).toUpperCase(),
      createdAt: noteToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(notePayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center shrink-0 shadow-2xs">
              <StickyNote className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                {noteToEdit ? 'Edit Field Note & Memo' : 'Create New Field Note & Memo'}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Rich engineering notes, site diaries, meeting minutes & checklists
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">

          {/* Title & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Note Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Substation Trench Dewatering & Soil Density Inspection..."
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as NotePriority)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Category & Color Themes Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-[#0B5FFF]" /> Note Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as NoteCategory)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Palette className="h-3.5 w-3.5 text-amber-500" /> Color Accent
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all ${c.bgClass} ${
                      color === c.value ? 'border-[#0B5FFF] scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                    }`}
                    title={c.label}
                  >
                    {color === c.value && <div className="h-2 w-2 rounded-full bg-[#0B5FFF]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content & Formatting Toolbar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <label>Detailed Note Content / Memo</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300"
                  title="Bold"
                >
                  <Bold className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs italic text-slate-700 dark:text-slate-300"
                  title="Italic"
                >
                  <Italic className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n### ')}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300"
                  title="Heading"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n- ')}
                  className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300"
                  title="Bullet List"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={6}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type your engineering observation, site instructions, meeting decisions, or diary entries here..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed outline-none focus:border-[#0B5FFF] font-normal"
            />
          </div>

          {/* Interactive Checklists Builder */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-[#0B5FFF]" /> Action Items & Checklist
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {checklists.filter(c => c.completed).length}/{checklists.length} done
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem(e);
                  }
                }}
                placeholder="Add checklist item and press Enter..."
                className="flex-1 h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddChecklistItem}
                className="h-8 text-xs font-bold bg-[#0B5FFF] text-white rounded-xl gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {checklists.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                {checklists.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                      />
                      <span className={`truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {item.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entity Linkers in 3 Columns */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-600" /> Link Entities (Optional)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Linked Task / Activity */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <ClipboardList className="h-3.5 w-3.5 text-indigo-600" /> Task / Activity
                </label>
                <select
                  value={activityId}
                  onChange={e => setActivityId(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                >
                  <option value="">-- No Activity --</option>
                  {activities.map(act => (
                    <option key={act.id} value={act.id}>
                      {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Employee */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <User className="h-3.5 w-3.5 text-purple-600" /> Assignee / Person
                </label>
                <select
                  value={employeeId}
                  onChange={e => setEmployeeId(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                >
                  <option value="">-- Unassigned --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Machinery */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                  <Truck className="h-3.5 w-3.5 text-amber-600" /> Machinery / Plant
                </label>
                <select
                  value={equipmentId}
                  onChange={e => setEquipmentId(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                >
                  <option value="">-- None --</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags & Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tags */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-[#0B5FFF]" /> Tags & Keywords
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag & press Enter (e.g. soil, inspection, safety)..."
                className="w-full h-8 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {tags.map(t => (
                    <span 
                      key={t}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-50 text-[#0B5FFF] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-900 flex items-center gap-1"
                    >
                      #{t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-500">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-600" /> Photos & Attachments
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#0B5FFF] text-[11px] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Upload
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
              />

              {attachments.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No attachments added yet.</p>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 group">
                      {att.startsWith('data:image/') || att.startsWith('http') ? (
                        <img src={att} alt="attachment" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="h-12 px-2.5 bg-slate-100 dark:bg-slate-800 flex items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          Doc #{idx + 1}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Save & Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{noteToEdit ? 'Update Note' : 'Save Note'}</span>
              </Button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
