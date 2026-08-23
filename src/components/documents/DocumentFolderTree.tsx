import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Layers, 
  Plus, 
  FileText, 
  X, 
  Check,
  Building2,
  HardHat
} from 'lucide-react';
import { DocumentFolder, DocumentItem } from '../../types';
import { Button } from '../ui';

interface DocumentFolderTreeProps {
  folders: DocumentFolder[];
  documents: DocumentItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAddFolder: (folder: DocumentFolder) => void;
  onUpdateFolder: (folder: DocumentFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  canEdit: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function DocumentFolderTree({
  folders,
  documents,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  canEdit,
  isOpenMobile,
  onCloseMobile
}: DocumentFolderTreeProps) {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() => {
    return new Set(['FLD-02']); // expand drawings by default
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  const [folderName, setFolderName] = useState('');
  const [folderCode, setFolderCode] = useState('');
  const [folderColor, setFolderColor] = useState('#0B5FFF');

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Group folders by parentId
  const rootFolders = useMemo(() => {
    return folders.filter(f => !f.parentId);
  }, [folders]);

  const childFoldersMap = useMemo(() => {
    const map = new Map<string, DocumentFolder[]>();
    folders.forEach(f => {
      if (f.parentId) {
        const existing = map.get(f.parentId) || [];
        existing.push(f);
        map.set(f.parentId, existing);
      }
    });
    return map;
  }, [folders]);

  // Calculate document counts per folder
  const folderDocCounts = useMemo(() => {
    const counts = new Map<string, number>();
    documents.forEach(d => {
      if (d.folderId) {
        counts.set(d.folderId, (counts.get(d.folderId) || 0) + 1);
      }
    });
    return counts;
  }, [documents]);

  const handleOpenCreate = (parentId: string | null = null) => {
    setCreateParentId(parentId);
    setEditingFolder(null);
    setFolderName('');
    setFolderCode('');
    setFolderColor('#0B5FFF');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setCreateParentId(folder.parentId || null);
    setFolderName(folder.name);
    setFolderCode(folder.code || '');
    setFolderColor(folder.color || '#0B5FFF');
    setIsCreateModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (editingFolder) {
      onUpdateFolder({
        ...editingFolder,
        name: folderName.trim(),
        code: folderCode.trim() || undefined,
        color: folderColor,
        parentId: createParentId
      });
    } else {
      const newFolder: DocumentFolder = {
        id: `FLD-${Date.now().toString(36).toUpperCase()}`,
        projectId: 'PRJ-001',
        name: folderName.trim(),
        code: folderCode.trim() || undefined,
        color: folderColor,
        parentId: createParentId,
        createdAt: new Date().toISOString()
      };
      onAddFolder(newFolder);
      if (createParentId) {
        setExpandedFolderIds(prev => new Set(prev).add(createParentId));
      }
    }

    setIsCreateModalOpen(false);
  };

  const renderFolderItem = (folder: DocumentFolder, depth: number = 0) => {
    const children = childFoldersMap.get(folder.id) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const docCount = folderDocCounts.get(folder.id) || 0;

    return (
      <div key={folder.id} className="space-y-1">
        <div
          onClick={() => {
            onSelectFolder(folder.id);
            if (onCloseMobile) onCloseMobile();
          }}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center justify-between py-2 px-2.5 rounded-xl cursor-pointer transition-all text-xs font-semibold select-none ${
            isSelected
              ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] font-bold shadow-2xs'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            <div 
              className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0" 
              style={{ backgroundColor: `${folder.color || '#0B5FFF'}15`, color: folder.color || '#0B5FFF' }}
            >
              {isSelected ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
            </div>

            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
              docCount > 0 
                ? (isSelected ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400')
                : 'text-slate-400'
            }`}>
              {docCount}
            </span>

            {canEdit && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreate(folder.id);
                  }}
                  title="Add Subfolder"
                  className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(folder);
                  }}
                  title="Edit Folder"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nested Subfolders */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {children.map(child => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
        
        <div className="space-y-3 overflow-y-auto pr-1">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#0B5FFF]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Directory Folders
              </h3>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => handleOpenCreate(null)}
                className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                title="Create New Root Folder"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Root All Documents Button */}
          <div
            onClick={() => {
              onSelectFolder(null);
              if (onCloseMobile) onCloseMobile();
            }}
            className={`flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-all text-xs font-bold select-none ${
              selectedFolderId === null
                ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF] shadow-2xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#0B5FFF] flex items-center justify-center">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span>All Project Documents</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
              {documents.length}
            </span>
          </div>

          {/* Folder Tree List */}
          <div className="space-y-0.5 pt-1">
            {rootFolders.map(f => renderFolderItem(f, 0))}
          </div>

        </div>

        {/* Tree Footer / Quick Tip */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>ISO 19650 Project Tree</span>
          <span>{folders.length} Folders</span>
        </div>

      </div>

      {/* Create / Edit Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
                  <FolderPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingFolder ? 'Edit Folder' : (createParentId ? 'Create New Subfolder' : 'Create New Root Folder')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Organize drawings, specifications, or submittals.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={e => setFolderName(e.target.value)}
                  placeholder="e.g. 02.1 - Civil & Earthworks"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Folder Code
                  </label>
                  <input
                    type="text"
                    value={folderCode}
                    onChange={e => setFolderCode(e.target.value)}
                    placeholder="e.g. 02-CIV"
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Folder Color Tag
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {['#0B5FFF', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFolderColor(c)}
                        style={{ backgroundColor: c }}
                        className={`h-7 w-7 rounded-lg transition-transform ${
                          folderColor === c ? 'scale-110 ring-2 ring-blue-500 ring-offset-2' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Parent Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Parent Folder (Optional)
                </label>
                <select
                  value={createParentId || ''}
                  onChange={e => setCreateParentId(e.target.value || null)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                >
                  <option value="">-- Root Level (No Parent) --</option>
                  {folders.filter(f => f.id !== editingFolder?.id).map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {editingFolder ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteFolder(editingFolder.id);
                      setIsCreateModalOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Folder</span>
                  </button>
                ) : <span />}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl text-xs bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold"
                  >
                    {editingFolder ? 'Save Changes' : 'Create Folder'}
                  </Button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
}
