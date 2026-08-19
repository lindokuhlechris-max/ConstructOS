import React from 'react';
import { 
  Pin, 
  Trash2, 
  Edit3, 
  Bell, 
  Calendar, 
  Tag, 
  Paperclip, 
  User, 
  Truck, 
  ClipboardList, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Archive, 
  RotateCcw,
  BookOpen,
  Eye,
  Users,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Package,
  HelpCircle,
  StickyNote,
  ExternalLink,
  Layers
} from 'lucide-react';
import { ActivityNote, NoteCategory, NoteColor } from '../../types';
import { useAppContext } from '../../context/AppContext';

export interface NoteCardProps {
  note: ActivityNote;
  onEdit: (note: ActivityNote) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onConvertToReminder: (note: ActivityNote) => void;
  onToggleChecklistItem?: (noteId: string, itemId: string) => void;
  viewMode?: 'grid' | 'list';
}

const CATEGORY_META: Record<NoteCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  'Site Diary': { label: 'Site Diary', icon: BookOpen, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-800' },
  'Site Observation': { label: 'Site Observation', icon: Eye, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  'Meeting Minutes': { label: 'Meeting Minutes', icon: Users, color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
  'Technical Memo': { label: 'Technical Memo', icon: Cpu, color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-800' },
  'QA & Inspection': { label: 'QA & Inspection', icon: ShieldCheck, color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-200 dark:border-teal-800' },
  'Safety & Risk': { label: 'Safety & Risk', icon: AlertTriangle, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-800' },
  'Materials & Delivery': { label: 'Materials & Delivery', icon: Package, color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/50', border: 'border-orange-200 dark:border-orange-800' },
  'Engineering Query': { label: 'Engineering Query', icon: HelpCircle, color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-50 dark:bg-cyan-950/50', border: 'border-cyan-200 dark:border-cyan-800' },
  'General': { label: 'General Memo', icon: StickyNote, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' }
};

const COLOR_STYLES: Record<string, { bg: string; border: string; glow: string }> = {
  default: {
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-slate-200 dark:border-slate-800',
    glow: 'hover:border-slate-300 dark:hover:border-slate-700'
  },
  blue: {
    bg: 'bg-blue-50/70 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/60',
    glow: 'hover:border-blue-400 dark:hover:border-blue-700'
  },
  amber: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/60',
    glow: 'hover:border-amber-400 dark:hover:border-amber-700'
  },
  emerald: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900/60',
    glow: 'hover:border-emerald-400 dark:hover:border-emerald-700'
  },
  rose: {
    bg: 'bg-rose-50/70 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-900/60',
    glow: 'hover:border-rose-400 dark:hover:border-rose-700'
  },
  purple: {
    bg: 'bg-purple-50/70 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-900/60',
    glow: 'hover:border-purple-400 dark:hover:border-purple-700'
  },
  indigo: {
    bg: 'bg-indigo-50/70 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-900/60',
    glow: 'hover:border-indigo-400 dark:hover:border-indigo-700'
  },
  cyan: {
    bg: 'bg-cyan-50/70 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-900/60',
    glow: 'hover:border-cyan-400 dark:hover:border-cyan-700'
  },
  slate: {
    bg: 'bg-slate-100/80 dark:bg-slate-800/60',
    border: 'border-slate-300 dark:border-slate-700',
    glow: 'hover:border-slate-400'
  }
};

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  Low: { label: 'Low', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400' },
  Medium: { label: 'Medium', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-[#0B5FFF]' },
  High: { label: 'High Priority', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400' },
  Urgent: { label: 'CRITICAL', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-400 font-bold animate-pulse' }
};

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onConvertToReminder,
  onToggleChecklistItem,
  viewMode = 'grid'
}: NoteCardProps) {
  const { employees = [], equipment = [], activities = [], projects = [], reminders = [] } = useAppContext();

  const categoryMeta = CATEGORY_META[note.category] || CATEGORY_META['General'];
  const CategoryIcon = categoryMeta.icon;
  const colorTheme = COLOR_STYLES[note.color || 'default'] || COLOR_STYLES.default;
  const priorityBadge = PRIORITY_BADGES[note.priority] || PRIORITY_BADGES.Medium;

  // Resolve Linked Entities
  const linkedEmployee = employees.find(e => e.id === note.linkedEmployeeId);
  const linkedEquip = equipment.find(eq => eq.id === note.linkedEquipmentId);
  const linkedActivity = activities.find(a => a.id === note.activityId);
  const linkedProject = projects.find(p => p.id === note.projectId);
  const linkedReminder = reminders.find(r => r.id === note.linkedReminderId);

  // Checklists stats
  const checklists = note.checklists || [];
  const completedChecklistCount = checklists.filter(c => c.completed).length;
  const totalChecklists = checklists.length;
  const checklistPercent = totalChecklists > 0 ? Math.round((completedChecklistCount / totalChecklists) * 100) : 0;

  // Attachments
  const attachments = [...(note.photos || []), ...(note.attachments || [])];

  const formattedDate = note.createdAt 
    ? new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (viewMode === 'list') {
    return (
      <div 
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${colorTheme.bg} ${colorTheme.border} ${colorTheme.glow} shadow-2xs`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            className={`p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 ${
              note.isPinned 
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' 
                : 'text-slate-300 hover:text-slate-500 dark:hover:text-slate-300'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-amber-500' : ''}`} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${categoryMeta.bg} ${categoryMeta.color} ${categoryMeta.border}`}>
                <CategoryIcon className="h-3 w-3 shrink-0" />
                <span>{categoryMeta.label}</span>
              </span>

              {note.priority !== 'Medium' && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityBadge.bg} ${priorityBadge.text}`}>
                  {priorityBadge.label}
                </span>
              )}

              <h4 
                onClick={() => onEdit(note)}
                className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#0B5FFF] dark:hover:text-blue-400 cursor-pointer truncate"
              >
                {note.title}
              </h4>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
              {note.content}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
              <span>By {note.author || 'User'}</span>
              <span>• {formattedDate}</span>
              {totalChecklists > 0 && (
                <span className="text-[#0B5FFF] font-semibold flex items-center gap-1">
                  <CheckSquare className="h-3 w-3" /> {completedChecklistCount}/{totalChecklists} done
                </span>
              )}
              {linkedActivity && (
                <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" /> {linkedActivity.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => onConvertToReminder(note)}
            className="p-1.5 text-slate-400 hover:text-[#0B5FFF] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="Convert to actionable reminder"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit note"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleArchive(note.id)}
            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title={note.isArchived ? 'Unarchive' : 'Archive note'}
          >
            {note.isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Grid / Sticky Card View
  return (
    <div 
      className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between gap-3 relative group ${colorTheme.bg} ${colorTheme.border} ${colorTheme.glow} shadow-sm hover:shadow-md`}
    >
      <div>
        {/* Card Header & Pin */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${categoryMeta.bg} ${categoryMeta.color} ${categoryMeta.border}`}>
              <CategoryIcon className="h-3 w-3 shrink-0" />
              <span>{categoryMeta.label}</span>
            </span>

            {note.priority && note.priority !== 'Medium' && (
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${priorityBadge.bg} ${priorityBadge.text}`}>
                {priorityBadge.label}
              </span>
            )}

            {note.isArchived && (
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                Archived
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(note.id)}
            className={`p-1.5 rounded-xl transition-all ${
              note.isPinned 
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 shadow-2xs' 
                : 'text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800'
            }`}
            title={note.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className={`h-3.5 w-3.5 ${note.isPinned ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Note Title */}
        <h3 
          onClick={() => onEdit(note)}
          className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug cursor-pointer hover:text-[#0B5FFF] dark:hover:text-blue-400 transition-colors"
        >
          {note.title}
        </h3>

        {/* Note Content */}
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line font-normal">
          {note.content}
        </p>

        {/* Interactive Checklist Preview */}
        {totalChecklists > 0 && (
          <div className="mt-3 p-2.5 rounded-2xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <CheckSquare className="h-3 w-3 text-[#0B5FFF]" /> Checklist
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {completedChecklistCount}/{totalChecklists} ({checklistPercent}%)
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  checklistPercent === 100 ? 'bg-emerald-500' : 'bg-[#0B5FFF]'
                }`}
                style={{ width: `${checklistPercent}%` }}
              />
            </div>

            <div className="space-y-1 pt-1 max-h-28 overflow-y-auto">
              {checklists.slice(0, 4).map(item => (
                <label 
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleChecklistItem) {
                      onToggleChecklistItem(note.id, item.id);
                    }
                  }}
                  className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-700 dark:text-slate-300 select-none group/item"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {}}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                  />
                  <span className={`truncate ${item.completed ? 'line-through text-slate-400' : ''}`}>
                    {item.text}
                  </span>
                </label>
              ))}
              {totalChecklists > 4 && (
                <p className="text-[10px] text-slate-400 italic pt-0.5">
                  +{totalChecklists - 4} more items...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Attachment Thumbnails */}
        {attachments.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
            {attachments.slice(0, 3).map((att, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                {att.startsWith('data:image/') || att.startsWith('http') ? (
                  <img src={att} alt="Attachment" className="h-10 w-10 object-cover" />
                ) : (
                  <div className="h-10 px-2 bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    <Paperclip className="h-3 w-3 text-[#0B5FFF]" /> File
                  </div>
                )}
              </div>
            ))}
            {attachments.length > 3 && (
              <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                +{attachments.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1 flex-wrap">
            {note.tags.map(t => (
              <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Entity Badges */}
        {(linkedActivity || linkedEmployee || linkedEquip || linkedProject || linkedReminder) && (
          <div className="mt-3 pt-2.5 border-t border-slate-100/80 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px]">
            {linkedProject && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" /> {linkedProject.name}
              </span>
            )}
            {linkedActivity && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 flex items-center gap-1">
                <ClipboardList className="h-2.5 w-2.5" /> {linkedActivity.name}
              </span>
            )}
            {linkedEmployee && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 flex items-center gap-1">
                <User className="h-2.5 w-2.5" /> {linkedEmployee.firstName} {linkedEmployee.lastName}
              </span>
            )}
            {linkedEquip && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 flex items-center gap-1">
                <Truck className="h-2.5 w-2.5" /> {linkedEquip.name}
              </span>
            )}
            {linkedReminder && (
              <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-1">
                <Bell className="h-2.5 w-2.5" /> Due: {linkedReminder.dueDate}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[9px] flex items-center justify-center shrink-0">
            {note.authorInitials || note.author?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <span className="text-[10px] text-slate-400 truncate">
            {formattedDate}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onConvertToReminder(note)}
            className="p-1.5 text-slate-400 hover:text-[#0B5FFF] dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            title="Convert note to actionable reminder"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(note)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit note"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleArchive(note.id)}
            className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            title={note.isArchived ? 'Restore note' : 'Archive note'}
          >
            {note.isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete note"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
