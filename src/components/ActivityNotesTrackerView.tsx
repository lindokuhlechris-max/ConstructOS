import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Pin, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Tag, 
  Building2, 
  Layers, 
  ShieldCheck, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Sliders, 
  LayoutGrid, 
  List, 
  FolderTree, 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles, 
  ListChecks, 
  AlertCircle, 
  CheckSquare, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  BadgeCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
import { Activity, SubTask, ActivityNote, NoteCategory, NotePriority, NoteChecklistItem } from '../types';
import { useAppContext } from '../context/AppContext';
import { getPersonInitials, getSubtaskProgressionNumber } from '../lib/labourUtils';
import { saveOrShareFile } from '../lib/fileExportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ActivityNotesTrackerViewProps {
  onOpenActivityDetail?: (activity: Activity) => void;
  filterByActivityId?: string; // Optional activity filter when opened in detail mode
}

const CATEGORY_COLORS: Record<NoteCategory, { bg: string; text: string; border: string }> = {
  'Site Observation': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  'Technical Memo': { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-[#0B5FFF] dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'QA & Inspection': { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  'Safety & Risk': { bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  'Materials & Delivery': { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  'Engineering Query': { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'General': { bg: 'bg-slate-50 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' }
};

const PRIORITY_BADGES: Record<NotePriority, { label: string; class: string }> = {
  'Urgent': { label: 'Urgent 🚨', class: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300' },
  'High': { label: 'High Priority ⚠️', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' },
  'Medium': { label: 'Medium', class: 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200' },
  'Low': { label: 'Low', class: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' }
};

export function ActivityNotesTrackerView({ onOpenActivityDetail, filterByActivityId }: ActivityNotesTrackerViewProps) {
  const { activities = [], projects = [], notes = [], addNote, updateNote, deleteNote, currentUserProfile } = useAppContext();

  // -------------------------------------------------------------
  // Filter & Search State
  // -------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>(filterByActivityId || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped'>('grid');

  // -------------------------------------------------------------
  // Note Creator / Editor Modal State
  // -------------------------------------------------------------
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoteCategory>('Technical Memo');
  const [formPriority, setFormPriority] = useState<NotePriority>('Medium');
  const [formActivityId, setFormActivityId] = useState<string>(filterByActivityId || '');
  const [formSubtaskId, setFormSubtaskId] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formChecklists, setFormChecklists] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formColor, setFormColor] = useState<'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'slate'>('blue');
  const [formIsPinned, setFormIsPinned] = useState(false);

  // Derive subtasks for the currently chosen activity in form
  const selectedFormActivity = useMemo(() => {
    return activities.find(a => a.id === formActivityId);
  }, [activities, formActivityId]);

  // Reset form when modal opens
  const handleOpenNewNote = (presetActivityId?: string, presetSubtaskId?: string) => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('Technical Memo');
    setFormPriority('Medium');
    setFormActivityId(presetActivityId || filterByActivityId || '');
    setFormSubtaskId(presetSubtaskId || '');
    setFormTags('');
    setFormChecklists([]);
    setNewChecklistText('');
    setFormLocation('');
    setFormColor('blue');
    setFormIsPinned(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditNote = (note: ActivityNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormCategory(note.category);
    setFormPriority(note.priority);
    setFormActivityId(note.activityId || '');
    setFormSubtaskId(note.subtaskId || '');
    setFormTags(note.tags ? note.tags.join(', ') : '');
    setFormChecklists(note.checklists ? [...note.checklists] : []);
    setNewChecklistText('');
    setFormLocation(note.location || '');
    setFormColor(note.color || 'blue');
    setFormIsPinned(!!note.isPinned);
    setIsEditorOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newChecklistText.trim(),
      completed: false
    };
    setFormChecklists(prev => [...prev, newItem]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setFormChecklists(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please provide a note title.');
      return;
    }

    const linkedAct = activities.find(a => a.id === formActivityId);
    let linkedSubtask: SubTask | undefined;
    let subtaskSeqStr: string | undefined;

    if (linkedAct && formSubtaskId) {
      const subtasks = linkedAct.subtasks || [];
      const sIdx = subtasks.findIndex(s => s.id === formSubtaskId);
      if (sIdx !== -1) {
        linkedSubtask = subtasks[sIdx];
        subtaskSeqStr = getSubtaskProgressionNumber(subtasks, sIdx);
      }
    }

    const parsedTags = formTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const nowIso = new Date().toISOString();
    const authorName = currentUserProfile?.name || 'Site Engineer';
    const authorRoleStr = currentUserProfile?.role || 'Engineer';

    if (editingNoteId) {
      const existing = notes.find(n => n.id === editingNoteId);
      if (!existing) return;

      const updated: ActivityNote = {
        ...existing,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        priority: formPriority,
        activityId: linkedAct ? linkedAct.id : undefined,
        activityName: linkedAct ? linkedAct.name : undefined,
        subtaskId: linkedSubtask ? linkedSubtask.id : undefined,
        subtaskTitle: linkedSubtask ? linkedSubtask.title : undefined,
        subtaskSeq: subtaskSeqStr,
        tags: parsedTags,
        checklists: formChecklists,
        location: formLocation.trim() || undefined,
        color: formColor,
        isPinned: formIsPinned,
        updatedAt: nowIso
      };
      updateNote(updated);
    } else {
      const newNoteItem: ActivityNote = {
        id: `NOTE-${Date.now().toString().slice(-5)}`,
        projectId: linkedAct?.projectId || projects[0]?.id || 'PROJ-01',
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        priority: formPriority,
        activityId: linkedAct ? linkedAct.id : undefined,
        activityName: linkedAct ? linkedAct.name : undefined,
        subtaskId: linkedSubtask ? linkedSubtask.id : undefined,
        subtaskTitle: linkedSubtask ? linkedSubtask.title : undefined,
        subtaskSeq: subtaskSeqStr,
        tags: parsedTags,
        checklists: formChecklists,
        location: formLocation.trim() || undefined,
        color: formColor,
        isPinned: formIsPinned,
        isResolved: false,
        author: authorName,
        authorRole: authorRoleStr,
        authorInitials: getPersonInitials(authorName),
        createdAt: nowIso,
        updatedAt: nowIso
      };
      addNote(newNoteItem);
    }

    setIsEditorOpen(false);
  };

  // Toggle checklist item directly on card
  const handleToggleCardChecklist = (noteId: string, checklistId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.checklists) return;

    const updatedChecklists = note.checklists.map(c => 
      c.id === checklistId ? { ...c, completed: !c.completed } : c
    );

    updateNote({
      ...note,
      checklists: updatedChecklists,
      updatedAt: new Date().toISOString()
    });
  };

  // Toggle Pin on card
  const handleTogglePin = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    updateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString()
    });
  };

  // Toggle Resolved status
  const handleToggleResolved = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    updateNote({
      ...note,
      isResolved: !note.isResolved,
      updatedAt: new Date().toISOString()
    });
  };

  // -------------------------------------------------------------
  // Filtered Notes Computation
  // -------------------------------------------------------------
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // Activity Filter
      if (selectedActivityId === 'unlinked' && n.activityId) return false;
      if (selectedActivityId !== 'all' && selectedActivityId !== 'unlinked' && n.activityId !== selectedActivityId) return false;

      // Category Filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;

      // Priority Filter
      if (selectedPriority !== 'all' && n.priority !== selectedPriority) return false;

      // Status Filter
      if (statusFilter === 'active' && n.isResolved) return false;
      if (statusFilter === 'resolved' && !n.isResolved) return false;

      // Full-text Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = n.title.toLowerCase().includes(q);
        const inContent = n.content.toLowerCase().includes(q);
        const inAuthor = n.author.toLowerCase().includes(q);
        const inActivity = (n.activityName || '').toLowerCase().includes(q) || (n.activityId || '').toLowerCase().includes(q);
        const inSubtask = (n.subtaskTitle || '').toLowerCase().includes(q);
        const inTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inTitle && !inContent && !inAuthor && !inActivity && !inSubtask && !inTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Pinned notes always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes, selectedActivityId, selectedCategory, selectedPriority, statusFilter, searchTerm]);

  // Aggregate Metrics
  const totalNotesCount = notes.length;
  const pinnedNotesCount = notes.filter(n => n.isPinned).length;
  const urgentNotesCount = notes.filter(n => n.priority === 'Urgent' || n.priority === 'High').length;
  const linkedNotesCount = notes.filter(n => n.activityId).length;
  const resolvedNotesCount = notes.filter(n => n.isResolved).length;

  // Notes grouped by activity for 'grouped' view mode
  const notesGroupedByActivity = useMemo(() => {
    const map = new Map<string, { activityName: string; activity?: Activity; notes: ActivityNote[] }>();

    filteredNotes.forEach(n => {
      const key = n.activityId || 'General (Unlinked)';
      const actName = n.activityName || (n.activityId ? n.activityId : 'General Site Memos & Observations');
      const actObj = activities.find(a => a.id === n.activityId);

      if (!map.has(key)) {
        map.set(key, { activityName: actName, activity: actObj, notes: [] });
      }
      map.get(key)!.notes.push(n);
    });

    return Array.from(map.entries());
  }, [filteredNotes, activities]);

  // -------------------------------------------------------------
  // Vector PDF Note Dossier Export
  // -------------------------------------------------------------
  const handleExportNotesPdf = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;

      const brandBlue = [11, 95, 255];
      const darkNavy = [15, 23, 42];
      const slateMuted = [100, 116, 139];

      // Corporate Header Banner
      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.rect(0, 0, pageWidth, 54, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('CONSTRUCTFIELD ENTERPRISE', margin, 24);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Field & Engineering Notebook Dossier', margin, 41);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL MEMORANDUM', pageWidth - margin - 140, 24);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, pageWidth - margin - 140, 41);

      let currentY = 74;

      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('Field Observations & Technical Notes Ledger', margin, currentY);

      currentY += 16;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        `Total Notes: ${filteredNotes.length}   |   Urgent/High: ${urgentNotesCount}   |   Linked Activities: ${linkedNotesCount}   |   Resolved: ${resolvedNotesCount}`,
        margin,
        currentY
      );

      currentY += 16;

      const tableHeaders = [
        ['ID & Title', 'Linked Activity & Subtask', 'Category & Priority', 'Author / Date', 'Status & Notes']
      ];

      const tableData = filteredNotes.map(n => [
        `[${n.id}] ${n.title}\n${n.content.slice(0, 120)}${n.content.length > 120 ? '...' : ''}`,
        n.activityId ? `${n.activityId}: ${n.activityName || ''}${n.subtaskSeq ? `\nSubtask ${n.subtaskSeq}: ${n.subtaskTitle || ''}` : ''}` : 'General Memo',
        `${n.category}\n[${n.priority}]`,
        `${n.author}\n${new Date(n.createdAt).toLocaleDateString()}`,
        n.isResolved ? '✓ RESOLVED' : 'ACTIVE'
      ]);

      autoTable(doc, {
        startY: currentY,
        head: tableHeaders,
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: brandBlue,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          cellPadding: 5
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4.5
        },
        columnStyles: {
          0: { cellWidth: 160, fontStyle: 'bold' },
          1: { cellWidth: 130 },
          2: { cellWidth: 85 },
          3: { cellWidth: 80 },
          4: { cellWidth: 65, fontStyle: 'bold', halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });

      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(
          `Constructfield Enterprise Engineering Notebook  |  Generated ${new Date().toLocaleDateString()}`,
          margin,
          doc.internal.pageSize.getHeight() - 15
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 40, doc.internal.pageSize.getHeight() - 15);
      }

      const blob = doc.output('blob');
      await saveOrShareFile({
        filename: `engineering_notes_dossier_${new Date().toISOString().split('T')[0]}.pdf`,
        blob,
        title: 'Engineering Notes Dossier',
        text: 'Constructfield Engineering Notes Dossier'
      });
    } catch (err) {
      console.error('Failed to export notes PDF:', err);
      alert('Error exporting notes PDF.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Top Header & KPI Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Field & Engineering Notebook
            </h2>
            <Badge variant="outline" className="text-xs font-mono text-[#0B5FFF] border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30">
              {filteredNotes.length} Notes
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Capture, link, and organize technical memos, site observations, QA remarks, and action items linked to activities and subtasks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportNotesPdf}
            className="rounded-xl text-xs h-9 gap-1.5"
            title="Download PDF Notes Dossier"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenNewNote()}
            className="rounded-xl text-xs h-9 gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white shadow-xs font-bold px-4"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Notes</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalNotesCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">In Project Log</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pinned Memos</p>
          <p className="text-xl font-black text-[#0B5FFF] mt-0.5">{pinnedNotesCount}</p>
          <p className="text-[10px] text-blue-500 font-medium mt-0.5">Top priority</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgent / High</p>
          <p className="text-xl font-black text-rose-600 mt-0.5">{urgentNotesCount}</p>
          <p className="text-[10px] text-rose-500 font-medium mt-0.5">Requires attention</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Linked to Activities</p>
          <p className="text-xl font-black text-indigo-600 mt-0.5">{linkedNotesCount}</p>
          <p className="text-[10px] text-indigo-500 font-medium mt-0.5">Cross-referenced</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolved Items</p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{resolvedNotesCount}</p>
          <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Actioned</p>
        </div>
      </div>

      {/* 3. Search & Multi-Criteria Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Full-text Search Bar */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes by title, content, author, tags, or activity name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
          </div>

          {/* Activity Filter Dropdown */}
          <select
            value={selectedActivityId}
            onChange={e => setSelectedActivityId(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Activities & General</option>
            <option value="unlinked">Unlinked General Notes</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.id}: {a.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent 🚨</option>
            <option value="High">High ⚠️</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved Only</option>
          </select>

          {/* View Mode Switcher */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List Ledger View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grouped' ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grouped by Activity View"
            >
              <FolderTree className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Categories:</span>
          {['all', 'Site Observation', 'Technical Memo', 'QA & Inspection', 'Safety & Risk', 'Materials & Delivery', 'Engineering Query', 'General'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0B5FFF] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Notes Content Rendering */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#0B5FFF] flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Notes Found</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm || selectedActivityId !== 'all' || selectedCategory !== 'all'
              ? 'No field notes matched your current filter criteria. Try adjusting filters or search term.'
              : 'Create your first engineering memo or field note linked to an activity to get started.'}
          </p>
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => handleOpenNewNote()}
              className="text-xs rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Create Field Note
            </Button>
          </div>
        </div>
      ) : viewMode === 'grouped' ? (
        /* GROUPED BY ACTIVITY ACCORDION VIEW */
        <div className="space-y-6">
          {notesGroupedByActivity.map(([actKey, group]) => (
            <div key={actKey} className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {group.activityName}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {group.notes.length} {group.notes.length === 1 ? 'Note' : 'Notes'}
                  </Badge>
                </div>

                {group.activity && onOpenActivityDetail && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenActivityDetail(group.activity!)}
                    className="text-xs h-7 gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ExternalLink className="h-3 w-3" /> View Activity
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.notes.map(note => (
                  <NoteCardItem
                    key={note.id}
                    note={note}
                    onEdit={handleOpenEditNote}
                    onDelete={deleteNote}
                    onTogglePin={handleTogglePin}
                    onToggleResolved={handleToggleResolved}
                    onToggleChecklist={handleToggleCardChecklist}
                    onOpenActivityDetail={onOpenActivityDetail}
                    activities={activities}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        /* COMPACT LIST LEDGER VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3">Title & Content</th>
                <th className="p-3">Linked Activity / Subtask</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Author</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotes.map(note => (
                <tr key={note.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note.id)}
                      className={`p-1 rounded transition-colors ${note.isPinned ? 'text-[#0B5FFF]' : 'text-slate-300 hover:text-slate-500'}`}
                      title={note.isPinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-blue-500' : ''}`} />
                    </button>
                  </td>
                  <td className="p-3">
                    <p className={`font-bold ${note.isResolved ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {note.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{note.content}</p>
                  </td>
                  <td className="p-3">
                    {note.activityId ? (
                      <div>
                        <span className="font-mono font-bold text-[11px] text-[#0B5FFF]">{note.activityId}</span>
                        {note.subtaskSeq && (
                          <span className="ml-1 text-[10px] text-slate-500">
                            (Step {note.subtaskSeq})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">General</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CATEGORY_COLORS[note.category]?.bg} ${CATEGORY_COLORS[note.category]?.text} ${CATEGORY_COLORS[note.category]?.border}`}>
                      {note.category}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_BADGES[note.priority]?.class}`}>
                      {PRIORITY_BADGES[note.priority]?.label}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                    {note.author}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleResolved(note.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                        note.isResolved 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-emerald-50'
                      }`}
                    >
                      {note.isResolved ? '✓ Resolved' : 'Active'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditNote(note)}
                        className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-700"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete note "${note.title}"?`)) deleteNote(note.id);
                        }}
                        className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* MASONRY-STYLE CARD GRID VIEW (DEFAULT) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <NoteCardItem
              key={note.id}
              note={note}
              onEdit={handleOpenEditNote}
              onDelete={deleteNote}
              onTogglePin={handleTogglePin}
              onToggleResolved={handleToggleResolved}
              onToggleChecklist={handleToggleCardChecklist}
              onOpenActivityDetail={onOpenActivityDetail}
              activities={activities}
            />
          ))}
        </div>
      )}

      {/* 5. Create / Edit Note Modal */}
      {isEditorOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsEditorOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {editingNoteId ? 'Edit Field & Engineering Note' : 'Create New Field Note'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Record observations and cross-reference activities</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditorOpen(false)}
                className="h-8 w-8 p-0 rounded-lg text-slate-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveNote} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Title & Pinned */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Note Title *</label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={e => setFormIsPinned(e.target.checked)}
                      className="rounded border-blue-400 text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                    />
                    <span>Pin to top</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bedding sand compaction test verification..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as NoteCategory)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="Technical Memo">Technical Memo</option>
                    <option value="Site Observation">Site Observation</option>
                    <option value="QA & Inspection">QA & Inspection</option>
                    <option value="Safety & Risk">Safety & Risk</option>
                    <option value="Materials & Delivery">Materials & Delivery</option>
                    <option value="Engineering Query">Engineering Query</option>
                    <option value="General">General Memo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as NotePriority)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High ⚠️</option>
                    <option value="Urgent">Urgent 🚨</option>
                  </select>
                </div>
              </div>

              {/* Activity & Subtask Linker */}
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Link to Project Activity & Subtask
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Target Activity</label>
                    <select
                      value={formActivityId}
                      onChange={e => {
                        setFormActivityId(e.target.value);
                        setFormSubtaskId(''); // reset subtask when activity changes
                      }}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none"
                    >
                      <option value="">None (Unlinked General Memo)</option>
                      {activities.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.id}: {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Specific Subtask (Optional)</label>
                    <select
                      disabled={!formActivityId}
                      value={formSubtaskId}
                      onChange={e => setFormSubtaskId(e.target.value)}
                      className="w-full h-8 px-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none disabled:opacity-50"
                    >
                      <option value="">Whole Activity Level</option>
                      {selectedFormActivity?.subtasks?.map((st, idx) => {
                        const seq = getSubtaskProgressionNumber(selectedFormActivity.subtasks, idx);
                        return (
                          <option key={st.id} value={st.id}>
                            {seq} {st.title} ({st.category})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Note Content */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Detailed Content / Engineering Memo</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record site findings, measurements, instructions, calculations, or field observations..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                />
              </div>

              {/* Interactive Checklist Builder */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-[#0B5FFF]" />
                  Checklist & Action Items ({formChecklists.length})
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an actionable to-do step..."
                    value={newChecklistText}
                    onChange={e => setNewChecklistText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    className="flex-1 h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddChecklistItem}
                    className="h-8 text-xs rounded-xl bg-slate-800 text-white px-3"
                  >
                    Add Step
                  </Button>
                </div>

                {formChecklists.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formChecklists.map(chk => (
                      <div key={chk.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{chk.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(chk.id)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Survey, Compaction, Cable"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    className="w-full h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location / Chainage (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Chainage CH 1+250"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    className="w-full h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white px-5"
                >
                  {editingNoteId ? 'Update Note' : 'Create Note'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Interactive Note Card Item Component
// -------------------------------------------------------------
interface NoteCardItemProps {
  note: ActivityNote;
  onEdit: (note: ActivityNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleResolved: (id: string) => void;
  onToggleChecklist: (noteId: string, checklistId: string) => void;
  onOpenActivityDetail?: (activity: Activity) => void;
  activities: Activity[];
}

function NoteCardItem({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleResolved,
  onToggleChecklist,
  onOpenActivityDetail,
  activities
}: NoteCardItemProps) {
  const linkedActivity = useMemo(() => {
    return activities.find(a => a.id === note.activityId);
  }, [activities, note.activityId]);

  const categoryStyle = CATEGORY_COLORS[note.category] || CATEGORY_COLORS['General'];
  const priorityBadge = PRIORITY_BADGES[note.priority] || PRIORITY_BADGES['Medium'];

  const completedChecklistsCount = (note.checklists || []).filter(c => c.completed).length;

  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
        note.isPinned 
          ? 'border-[#0B5FFF] ring-1 ring-blue-500/30' 
          : 'border-slate-200 dark:border-slate-800'
      } ${note.isResolved ? 'opacity-75' : ''}`}
    >
      <div className="p-5 space-y-3">
        {/* Top Badges & Pin Action */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}>
              {note.category}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityBadge.class}`}>
              {priorityBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePin(note.id)}
              className={`p-1 rounded-lg transition-colors ${
                note.isPinned 
                  ? 'text-[#0B5FFF] hover:text-slate-400 bg-blue-50 dark:bg-blue-950/60' 
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={note.isPinned ? 'Unpin memo' : 'Pin memo to top'}
            >
              <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-blue-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h4 className={`font-bold text-sm sm:text-base leading-snug ${note.isResolved ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
          {note.title}
        </h4>

        {/* Linked Activity & Subtask Ribbon */}
        {note.activityId && (
          <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="h-3.5 w-3.5 text-[#0B5FFF] shrink-0" />
                <span className="font-mono font-black text-[#0B5FFF]">{note.activityId}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{note.activityName}</span>
              </div>

              {linkedActivity && onOpenActivityDetail && (
                <button
                  type="button"
                  onClick={() => onOpenActivityDetail(linkedActivity)}
                  className="text-[10px] font-bold text-[#0B5FFF] hover:underline shrink-0"
                >
                  View
                </button>
              )}
            </div>

            {note.subtaskSeq && (
              <div className="flex items-center gap-1.5 pl-5 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="font-mono font-bold bg-white dark:bg-slate-900 px-1 rounded border border-blue-200">
                  Step {note.subtaskSeq}
                </span>
                <span className="truncate">{note.subtaskTitle}</span>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>

        {/* Checklists (if any) */}
        {note.checklists && note.checklists.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Action Items</span>
              <span>{completedChecklistsCount}/{note.checklists.length} Done</span>
            </div>
            <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
              {note.checklists.map(c => (
                <label key={c.id} className="flex items-start gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={c.completed}
                    onChange={() => onToggleChecklist(note.id, c.id)}
                    className="mt-0.5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                  />
                  <span className={`text-[11px] ${c.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {c.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {note.tags.map((t, idx) => (
              <span key={idx} className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer Strip */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-[#0B5FFF] font-black text-[9px] flex items-center justify-center shrink-0">
            {note.authorInitials || getPersonInitials(note.author)}
          </div>
          <div className="truncate text-[11px]">
            <span className="font-bold text-slate-800 dark:text-slate-200">{note.author}</span>
            <span className="text-slate-400 ml-1.5">{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleResolved(note.id)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
              note.isResolved 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 hover:text-emerald-600'
            }`}
          >
            {note.isResolved ? '✓ Resolved' : 'Active'}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(note)}
            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Delete note "${note.title}"?`)) onDelete(note.id);
            }}
            className="h-7 w-7 p-0 rounded-lg text-slate-400 hover:text-rose-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
