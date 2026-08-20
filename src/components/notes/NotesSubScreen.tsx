import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Pin, 
  StickyNote, 
  Archive, 
  BookOpen, 
  Eye, 
  Users, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  Package, 
  HelpCircle, 
  Download, 
  CheckSquare, 
  Sparkles,
  Paperclip,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui';
import { ActivityNote, NoteCategory } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { NoteCard } from './NoteCard';
import { NoteEditorModal } from './NoteEditorModal';
import { ConvertToReminderModal } from './ConvertToReminderModal';
import { saveOrShareFile } from '../../lib/fileExportService';

const CATEGORY_TABS: { label: string; value: string; icon?: any }[] = [
  { label: 'All Notes', value: 'all' },
  { label: 'Site Diary', value: 'Site Diary', icon: BookOpen },
  { label: 'Observations', value: 'Site Observation', icon: Eye },
  { label: 'Meeting Minutes', value: 'Meeting Minutes', icon: Users },
  { label: 'Technical Memos', value: 'Technical Memo', icon: Cpu },
  { label: 'QA & Inspection', value: 'QA & Inspection', icon: ShieldCheck },
  { label: 'Safety & Risk', value: 'Safety & Risk', icon: AlertTriangle },
  { label: 'Materials', value: 'Materials & Delivery', icon: Package },
  { label: 'Engineering Queries', value: 'Engineering Query', icon: HelpCircle },
  { label: 'General', value: 'General', icon: StickyNote }
];

export function NotesSubScreen() {
  const { 
    notes = [], 
    addNote, 
    updateNote, 
    deleteNote, 
    togglePinNote, 
    toggleArchiveNote 
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);
  const [filterPinnedOnly, setFilterPinnedOnly] = useState(false);
  const [filterChecklistsOnly, setFilterChecklistsOnly] = useState(false);

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<ActivityNote | null>(null);
  const [noteToConvert, setNoteToConvert] = useState<ActivityNote | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      // Archive filter
      if (showArchived) {
        if (!n.isArchived) return false;
      } else {
        if (n.isArchived) return false;
      }

      // Pinned only filter
      if (filterPinnedOnly && !n.isPinned) return false;

      // Checklists only filter
      if (filterChecklistsOnly && (!n.checklists || n.checklists.length === 0)) return false;

      // Category filter
      if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesAuthor = (n.author || '').toLowerCase().includes(q);
        const matchesActivity = (n.activityName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesAuthor && !matchesActivity) {
          return false;
        }
      }

      return true;
    });
  }, [notes, showArchived, filterPinnedOnly, filterChecklistsOnly, selectedCategory, searchQuery]);

  // Separate pinned and unpinned when in standard view
  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.isPinned), [filteredNotes]);
  const regularNotes = useMemo(() => filteredNotes.filter(n => !n.isPinned), [filteredNotes]);

  const handleOpenCreate = (defaultCat?: NoteCategory) => {
    setNoteToEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (note: ActivityNote) => {
    setNoteToEdit(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = (note: ActivityNote) => {
    const exists = notes.some(n => n.id === note.id);
    if (exists) {
      updateNote(note);
      showToast(`Updated note "${note.title}"`);
    } else {
      addNote(note);
      showToast(`Created note "${note.title}"`);
    }
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.checklists) return;
    const updatedChecklists = note.checklists.map(c => 
      c.id === itemId ? { ...c, completed: !c.completed } : c
    );
    updateNote({
      ...note,
      checklists: updatedChecklists
    });
  };

  // Export Notes to Markdown Report
  const handleExportNotes = async () => {
    if (filteredNotes.length === 0) {
      alert('No notes available to export with current filters.');
      return;
    }

    let md = `# ConstructOS Field Notes & Site Memos Report\n`;
    md += `Generated on: ${new Date().toLocaleString()}\n`;
    md += `Total Notes Exported: ${filteredNotes.length}\n\n---\n\n`;

    filteredNotes.forEach((n, idx) => {
      md += `## ${idx + 1}. ${n.title}\n`;
      md += `**Category:** ${n.category} | **Priority:** ${n.priority} | **Date:** ${new Date(n.createdAt).toLocaleDateString()}\n`;
      if (n.author) md += `**Author:** ${n.author} (${n.authorRole || 'Staff'})\n`;
      if (n.activityName) md += `**Linked Activity:** ${n.activityName}\n`;
      if (n.tags && n.tags.length > 0) md += `**Tags:** ${n.tags.map(t => `#${t}`).join(', ')}\n`;
      md += `\n${n.content}\n\n`;

      if (n.checklists && n.checklists.length > 0) {
        md += `### Checklist Items:\n`;
        n.checklists.forEach(c => {
          md += `- [${c.completed ? 'x' : ' '}] ${c.text}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const filename = `ConstructOS_Field_Notes_${new Date().toISOString().split('T')[0]}.md`;
    await saveOrShareFile({
      filename,
      blob,
      title: 'Field Notes Report',
      text: `ConstructOS Field Notes Export (${filteredNotes.length} notes)`
    });
    showToast(`Exported ${filteredNotes.length} notes!`);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {toastMsg}
          </span>
          <button type="button" onClick={() => setToastMsg(null)} className="hover:underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Action Controls & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, tags, author, activity..."
            className="w-full h-10 pl-10 pr-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
          />
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          
          {/* Quick Filters */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                filterPinnedOnly 
                  ? 'bg-amber-500 text-white border-amber-500 shadow-2xs' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Filter pinned notes only"
            >
              <Pin className={`h-4 w-4 ${filterPinnedOnly ? 'fill-white' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setFilterChecklistsOnly(!filterChecklistsOnly)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                filterChecklistsOnly 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Filter notes with checklists"
            >
              <CheckSquare className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                showArchived 
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800' 
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={showArchived ? 'Show Active Notes' : 'Show Archived Notes'}
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Export Report */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportNotes}
            className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 gap-1.5 shadow-2xs"
            title="Export notes report to Markdown / Text"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Export</span>
          </Button>

          {/* New Note Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreate()}
            className="h-9 px-3.5 text-xs font-bold rounded-xl bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>

        </div>
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORY_TABS.map(tab => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.value;
          const count = tab.value === 'all' 
            ? notes.filter(n => showArchived ? n.isArchived : !n.isArchived).length
            : notes.filter(n => n.category === tab.value && (showArchived ? n.isArchived : !n.isArchived)).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-[#0B5FFF] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {Icon && <Icon className="h-3 w-3 shrink-0" />}
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1. PINNED NOTES SECTION */}
      {pinnedNotes.length > 0 && !showArchived && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Pin className="h-3.5 w-3.5 fill-amber-500" />
            <span>Pinned Notes ({pinnedNotes.length})</span>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2.5'}>
            {pinnedNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleOpenEdit}
                onDelete={deleteNote}
                onTogglePin={togglePinNote}
                onToggleArchive={toggleArchiveNote}
                onConvertToReminder={(n) => setNoteToConvert(n)}
                onToggleChecklistItem={handleToggleChecklistItem}
                viewMode={viewMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. REGULAR NOTES SECTION */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && regularNotes.length > 0 && !showArchived && (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
            <span>All Field Notes ({regularNotes.length})</span>
          </div>
        )}

        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <StickyNote className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {showArchived ? 'No archived notes found' : 'No field notes found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {searchQuery 
                  ? 'Try adjusting your search query or category filters.' 
                  : 'Create rich engineering notes, meeting minutes, site observations, and action checklists.'}
              </p>
            </div>
            {!showArchived && (
              <Button
                type="button"
                onClick={() => handleOpenCreate()}
                className="rounded-2xl text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create First Note
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2.5'}>
            {(pinnedNotes.length > 0 && !showArchived ? regularNotes : filteredNotes).map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleOpenEdit}
                onDelete={deleteNote}
                onTogglePin={togglePinNote}
                onToggleArchive={toggleArchiveNote}
                onConvertToReminder={(n) => setNoteToConvert(n)}
                onToggleChecklistItem={handleToggleChecklistItem}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        noteToEdit={noteToEdit}
        onSave={handleSaveNote}
        onConvertToReminder={(n) => setNoteToConvert(n)}
      />

      {/* Convert to Reminder Modal */}
      <ConvertToReminderModal
        isOpen={!!noteToConvert}
        onClose={() => setNoteToConvert(null)}
        note={noteToConvert}
        onConverted={() => showToast('Note successfully converted to reminder!')}
      />

    </div>
  );
}
