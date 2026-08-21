import React, { useState, useMemo, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Pin, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  Sparkles, 
  Mic, 
  Square, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  ListTodo, 
  Bell, 
  Filter, 
  Wrench, 
  ShieldAlert, 
  Fuel, 
  Handshake, 
  SlidersHorizontal,
  StickyNote,
  CornerDownRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from './ui';
import { Equipment, ActivityNote, NoteCategory, NotePriority, NoteColor, NoteChecklistItem, Priority } from '../types';
import { useAppContext } from '../context/AppContext';

export interface EquipmentNotesPanelProps {
  equipment: Equipment;
  canEdit?: boolean;
  onUpdateEquipment?: (updated: Equipment) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'Maintenance & Repair': {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800/60',
    icon: <Wrench className="h-3 w-3 text-rose-600" />
  },
  'Pre-Start & Safety Check': {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800/60',
    icon: <ShieldAlert className="h-3 w-3 text-amber-600" />
  },
  'Operator Memo & Shift Handover': {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
    icon: <User className="h-3 w-3 text-blue-600" />
  },
  'Fuel & Telematics': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    icon: <Fuel className="h-3 w-3 text-emerald-600" />
  },
  'Rental & Supplier Dossier': {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800/60',
    icon: <Handshake className="h-3 w-3 text-purple-600" />
  },
  'General': {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    icon: <StickyNote className="h-3 w-3 text-slate-500" />
  }
};

const NOTE_PRESETS = [
  {
    title: 'Pre-Start Daily Walkaround Inspection',
    category: 'Pre-Start & Safety Check' as NoteCategory,
    priority: 'Medium' as NotePriority,
    content: 'Engine oil, coolant, hydraulic fluid, tire/track pressure, and amber beacon lights verified. Machine safe to operate.',
    checklists: [
      { id: '1', text: 'Engine oil & coolant levels OK', completed: true },
      { id: '2', text: 'Hydraulic hoses & fittings leak-free', completed: true },
      { id: '3', text: 'Reverse alarm & horn functional', completed: true },
      { id: '4', text: 'Tracks/tires in good operating condition', completed: true }
    ]
  },
  {
    title: 'Hydraulic System / Hose Wear Notice',
    category: 'Maintenance & Repair' as NoteCategory,
    priority: 'High' as NotePriority,
    content: 'Observed slight hydraulic oil weeping at auxiliary line coupler. Requires mechanic inspection during next scheduled shift downtime.',
    checklists: [
      { id: '1', text: 'Notify workshop maintenance team', completed: false },
      { id: '2', text: 'Replace O-ring / seal fitting', completed: false }
    ]
  },
  {
    title: 'Shift Handover & Key Operating Note',
    category: 'Operator Memo & Shift Handover' as NoteCategory,
    priority: 'Low' as NotePriority,
    content: 'Machine parked on designated hardstand in Zone B. Fuel tank at 85%. Key handed over to night shift supervisor.',
    checklists: []
  }
];

export function EquipmentNotesPanel({ equipment, canEdit = true, onUpdateEquipment }: EquipmentNotesPanelProps) {
  const { 
    notes = [], 
    addNote, 
    updateNote, 
    deleteNote, 
    togglePinNote, 
    currentUserProfile,
    userRole,
    addAuditLog,
    convertNoteToReminder
  } = useAppContext();

  // 1. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterResolved, setFilterResolved] = useState<'active' | 'resolved' | 'all'>('active');

  // 2. Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Maintenance & Repair');
  const [formPriority, setFormPriority] = useState<NotePriority>('Medium');
  const [formContent, setFormContent] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formChecklists, setFormChecklists] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // 3. Quick Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // 4. General Machine Operating Memo Editor (bound to equipment.notes)
  const [generalMemo, setGeneralMemo] = useState(equipment.notes || '');
  const [isEditingGeneralMemo, setIsEditingGeneralMemo] = useState(false);
  const [isSavingGeneralMemo, setIsSavingGeneralMemo] = useState(false);

  // Sync generalMemo if equipment prop changes
  React.useEffect(() => {
    setGeneralMemo(equipment.notes || '');
  }, [equipment.notes]);

  // 5. Query Notes Linked to this Equipment
  const equipmentNotes = useMemo(() => {
    return notes.filter(n => {
      const isLinked = n.linkedEquipmentId === equipment.id || 
                       (n.title && n.title.includes(equipment.id)) ||
                       (n.tags && n.tags.includes(equipment.id));
      return isLinked;
    });
  }, [notes, equipment.id]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return equipmentNotes.filter(n => {
      if (selectedCategory !== 'All' && n.category !== selectedCategory) return false;
      if (filterResolved === 'active' && n.isResolved) return false;
      if (filterResolved === 'resolved' && !n.isResolved) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(q);
        const matchContent = n.content.toLowerCase().includes(q);
        const matchAuthor = (n.author || '').toLowerCase().includes(q);
        return matchTitle || matchContent || matchAuthor;
      }
      return true;
    }).sort((a, b) => {
      // Pinned first, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [equipmentNotes, selectedCategory, filterResolved, searchQuery]);

  // Handle General Memo Save
  const handleSaveGeneralMemo = () => {
    if (!onUpdateEquipment) return;
    setIsSavingGeneralMemo(true);
    const updated: Equipment = {
      ...equipment,
      notes: generalMemo.trim()
    };
    onUpdateEquipment(updated);
    setTimeout(() => {
      setIsSavingGeneralMemo(false);
      setIsEditingGeneralMemo(false);
    }, 200);

    addAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      projectId: 'FLEET',
      userId: currentUserProfile?.name || 'Current User',
      action: 'Equipment Memo Updated',
      details: `Updated operating instructions/memo for "${equipment.name}" (${equipment.id})`,
      timestamp: new Date().toISOString()
    });
  };

  // Open Form for New Note
  const handleOpenAddForm = (preset?: typeof NOTE_PRESETS[0]) => {
    setEditingNoteId(null);
    if (preset) {
      setFormTitle(preset.title);
      setFormCategory(preset.category);
      setFormPriority(preset.priority);
      setFormContent(preset.content);
      setFormChecklists(preset.checklists.map(c => ({ ...c, id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` })));
    } else {
      setFormTitle('');
      setFormCategory('Maintenance & Repair');
      setFormPriority('Medium');
      setFormContent('');
      setFormChecklists([]);
    }
    setFormIsPinned(false);
    setIsFormOpen(true);
  };

  // Open Form for Edit Note
  const handleOpenEditForm = (note: ActivityNote) => {
    setEditingNoteId(note.id);
    setFormTitle(note.title);
    setFormCategory(note.category);
    setFormPriority(note.priority || 'Medium');
    setFormContent(note.content);
    setFormIsPinned(!!note.isPinned);
    setFormChecklists(note.checklists ? [...note.checklists] : []);
    setIsFormOpen(true);
  };

  // Add Checklist Item in Form
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setFormChecklists(prev => [
      ...prev,
      {
        id: `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: newChecklistText.trim(),
        completed: false
      }
    ]);
    setNewChecklistText('');
  };

  // Toggle Checklist in Existing Note
  const handleToggleNoteChecklist = (note: ActivityNote, checkId: string) => {
    const updatedLists = (note.checklists || []).map(c => 
      c.id === checkId ? { ...c, completed: !c.completed } : c
    );
    updateNote({
      ...note,
      checklists: updatedLists,
      updatedAt: new Date().toISOString()
    });
  };

  // Voice Dictation
  const startRecording = async () => {
    setVoiceError(null);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setIsRecording(false);
      setVoiceError('Microphone not accessible. You can type your note directly.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        setIsRecording(false);
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
        const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setFormContent(prev => prev ? `${prev}\n[Voice Memo ${timeStamp}]: Recorded on site.` : `[Voice Memo ${timeStamp}]: Recorded on site.`);
      };
      mediaRecorderRef.current.stop();
    }
  };

  // Submit Note Form
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a title for the note.');
      return;
    }

    const now = new Date().toISOString();

    if (editingNoteId) {
      const existing = notes.find(n => n.id === editingNoteId);
      if (!existing) return;

      const updatedNote: ActivityNote = {
        ...existing,
        title: formTitle.trim(),
        category: formCategory as NoteCategory,
        priority: formPriority,
        content: formContent.trim(),
        isPinned: formIsPinned,
        checklists: formChecklists,
        updatedAt: now
      };
      updateNote(updatedNote);
    } else {
      const newNote: ActivityNote = {
        id: `NOTE-EQ-${Date.now().toString().slice(-6)}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory as NoteCategory,
        priority: formPriority,
        linkedEquipmentId: equipment.id,
        tags: [equipment.id, equipment.type, equipment.name],
        isPinned: formIsPinned,
        isResolved: false,
        author: currentUserProfile?.name || 'Site Supervisor',
        authorRole: currentUserProfile?.role || userRole || 'Supervisor',
        authorInitials: (currentUserProfile?.name || 'SS').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: now,
        checklists: formChecklists
      };
      addNote(newNote);
    }

    setIsFormOpen(false);
    setEditingNoteId(null);
  };

  // Toggle Resolved State
  const handleToggleResolveNote = (note: ActivityNote) => {
    updateNote({
      ...note,
      isResolved: !note.isResolved,
      updatedAt: new Date().toISOString()
    });
  };

  // Delete Note
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this equipment note?')) {
      deleteNote(noteId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions Bar */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#1E293B]/40 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Equipment Operational Notes & Field Memos
              </h3>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300">
                {equipmentNotes.length} {equipmentNotes.length === 1 ? 'Note' : 'Notes'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shift handover remarks, pre-start checklists, defect notices, and maintenance observations for {equipment.name}
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => handleOpenAddForm()}
                className="bg-[#0B5FFF] hover:bg-blue-600 text-white gap-2 rounded-xl text-xs font-bold h-9 px-3.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add Note / Defect
              </Button>
            </div>
          )}
        </div>

        {/* 2. Machine Operating Instructions / Standing Memo Box */}
        <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-amber-500" /> Standing Operating Instructions / Permanent Note
            </span>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditingGeneralMemo(!isEditingGeneralMemo)}
                className="text-[11px] font-bold text-[#0B5FFF] hover:underline"
              >
                {isEditingGeneralMemo ? 'Cancel' : 'Edit Instructions'}
              </button>
            )}
          </div>

          {isEditingGeneralMemo ? (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <textarea
                rows={3}
                value={generalMemo}
                onChange={e => setGeneralMemo(e.target.value)}
                placeholder="e.g. Always park on designated pad. Auxiliary high-flow hydraulics installed. Contact plant manager for weekend deployments..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setGeneralMemo(equipment.notes || '');
                    setIsEditingGeneralMemo(false);
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveGeneralMemo}
                  disabled={isSavingGeneralMemo}
                  className="h-7 text-xs rounded-lg bg-[#0B5FFF] text-white font-bold gap-1"
                >
                  <Save className="h-3 w-3" /> Save Instructions
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700 dark:text-slate-300 italic">
              {equipment.notes ? equipment.notes : 'No permanent operating instructions or standing notes set for this machine.'}
            </p>
          )}
        </div>

        {/* 3. Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes, defect remarks, authors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="All">All Categories</option>
              {Object.keys(CATEGORY_COLORS).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFilterResolved('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterResolved === 'active' 
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilterResolved('resolved')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterResolved === 'resolved' 
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={() => setFilterResolved('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterResolved === 'all' 
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Add / Edit Note Drawer Form */}
      {isFormOpen && (
        <form 
          onSubmit={handleSaveNote} 
          className="border border-indigo-200 dark:border-indigo-900/80 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 p-5 shadow-md space-y-4 animate-in fade-in"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-indigo-600" />
              {editingNoteId ? 'Edit Equipment Note' : 'Create New Equipment Note / Defect Observation'}
            </h4>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Note Title / Summary *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Hydraulic leak on boom, 250h Pre-start inspection completed..."
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Low', 'Medium', 'High', 'Urgent'] as NotePriority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormPriority(p)}
                    className={`py-1 rounded-lg text-xs font-bold border transition-all ${
                      formPriority === p 
                        ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-600'
                        : p === 'High' ? 'bg-amber-500 text-white border-amber-500'
                        : p === 'Medium' ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-700 text-white border-slate-700'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={e => setFormIsPinned(e.target.checked)}
                  className="rounded text-[#0B5FFF] focus:ring-[#0B5FFF] h-4 w-4"
                />
                <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Pin Note to Top
              </label>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Detailed Field Remarks / Observations
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
                    isRecording 
                      ? 'bg-rose-600 text-white animate-pulse' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  <Mic className="h-3 w-3" /> {isRecording ? 'Stop Recording' : 'Voice Memo'}
                </button>
              </div>
            </div>
            <textarea
              rows={3}
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="Provide clear details on machine performance, defects noted, maintenance instructions, or shift handover notes..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-[#0B5FFF]"
            />
            {voiceError && <p className="text-[10px] text-rose-500 mt-1">{voiceError}</p>}
          </div>

          {/* Action Item Checklists inside Form */}
          <div className="space-y-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              Follow-up Checklist Items (Optional):
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={e => setNewChecklistText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); } }}
                placeholder="e.g. Order replacement hydraulic filter..."
                className="flex-1 h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddChecklistItem}
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3"
              >
                Add Item
              </Button>
            </div>

            {formChecklists.length > 0 && (
              <div className="space-y-1 pt-1">
                {formChecklists.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 text-xs">
                    <span className="text-slate-800 dark:text-slate-200">#{idx + 1}. {item.text}</span>
                    <button
                      type="button"
                      onClick={() => setFormChecklists(prev => prev.filter(c => c.id !== item.id))}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsFormOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-xs font-bold bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> {editingNoteId ? 'Update Note' : 'Save Equipment Note'}
            </Button>
          </div>
        </form>
      )}

      {/* 5. Notes List / Feed */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No operational notes recorded yet for {equipment.name}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Log daily machine inspections, defect observations, operator shift handover notes, and fuel remarks.
            </p>

            {canEdit && (
              <div className="pt-2 flex justify-center gap-2 flex-wrap">
                {NOTE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOpenAddForm(preset)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-3 w-3 text-amber-600" /> {preset.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const catConfig = CATEGORY_COLORS[note.category] || CATEGORY_COLORS['General'];
              const hasChecklists = note.checklists && note.checklists.length > 0;
              const completedChecks = (note.checklists || []).filter(c => c.completed).length;

              return (
                <div
                  key={note.id}
                  className={`p-4 sm:p-5 rounded-2xl border bg-white dark:bg-slate-900/80 shadow-xs transition-all ${
                    note.isPinned 
                      ? 'border-amber-400 dark:border-amber-600/60 ring-1 ring-amber-400/30' 
                      : note.isResolved
                      ? 'border-slate-200 dark:border-slate-800 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.isPinned && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 text-[10px] font-black flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          <Pin className="h-2.5 w-2.5 fill-current" /> Pinned
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1.5 ${catConfig.bg} ${catConfig.text} ${catConfig.border}`}>
                        {catConfig.icon}
                        {note.category}
                      </span>

                      {note.priority && (
                        <span className={`px-2 py-0.2 rounded text-[10px] font-black uppercase ${
                          note.priority === 'Urgent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' :
                          note.priority === 'High' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' :
                          note.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {note.priority}
                        </span>
                      )}

                      {note.isResolved && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Resolved / Completed
                        </span>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => togglePinNote(note.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isPinned 
                            ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' 
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleResolveNote(note)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          note.isResolved 
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' 
                            : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title={note.isResolved ? 'Mark as Active' : 'Mark as Resolved'}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(note)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Note"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Note"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed mb-3">
                    {note.content}
                  </p>

                  {/* Checklist Items if Present */}
                  {hasChecklists && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5 mb-3">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        <span>Action Items</span>
                        <span>{completedChecks} / {note.checklists?.length} done</span>
                      </div>
                      {note.checklists?.map((chk) => (
                        <label
                          key={chk.id}
                          className="flex items-center gap-2 text-xs cursor-pointer select-none group"
                        >
                          <input
                            type="checkbox"
                            checked={!!chk.completed}
                            onChange={() => handleToggleNoteChecklist(note, chk.id)}
                            className="rounded text-[#0B5FFF] focus:ring-[#0B5FFF] h-3.5 w-3.5"
                          />
                          <span className={`${chk.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {chk.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Author & Timestamp Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black text-slate-700 dark:text-slate-300">
                        {note.authorInitials || 'SS'}
                      </div>
                      <span>Logged by: <strong className="text-slate-600 dark:text-slate-300">{note.author}</strong> ({note.authorRole || 'Supervisor'})</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
