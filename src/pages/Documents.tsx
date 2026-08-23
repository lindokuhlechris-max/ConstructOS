import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Button, CustomSelect, Badge } from '../components/ui';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Plus, 
  LayoutGrid, 
  List, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Layers, 
  FileCode, 
  Link as LinkIcon, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  Tag, 
  FolderOpen,
  Folder,
  Check,
  AlertCircle,
  Unlink,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  FileCheck,
  GitBranch,
  ShieldCheck,
  Building2,
  HardHat,
  Sidebar,
  CheckSquare,
  Square,
  Briefcase,
  Send
} from 'lucide-react';
import { DocumentCategory, DocumentFileType, DocumentItem, DocumentStatus, DocumentIssueStatus, DocumentDiscipline, DocumentFolder, WorkPackageBinder, DocumentTransmittal } from '../types';
import { printDocumentsSummary } from '../lib/pdfPrint';
import { exportDocumentsToCSV } from '../lib/csvExport';
import { downloadDocument, deleteDocumentFile } from '../lib/documentStorage';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { DocumentEditModal } from '../components/documents/DocumentEditModal';
import { DocumentActivityAssignModal } from '../components/documents/DocumentActivityAssignModal';
import { MasterDocumentRegisterModal } from '../components/documents/MasterDocumentRegisterModal';
import { DocumentFolderTree } from '../components/documents/DocumentFolderTree';
import { DocumentBatchUploadModal } from '../components/documents/DocumentBatchUploadModal';
import { DocumentBulkActionBar } from '../components/documents/DocumentBulkActionBar';
import { WorkPackageBindersModal } from '../components/documents/WorkPackageBindersModal';
import { DocumentTransmittalModal } from '../components/documents/DocumentTransmittalModal';
import { TransmittalRegisterModal } from '../components/documents/TransmittalRegisterModal';

const CATEGORIES: ('All' | DocumentCategory)[] = [
  'All',
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

const DISCIPLINES: ('All' | DocumentDiscipline)[] = [
  'All',
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

export function Documents() {
  const { 
    documents, 
    documentFolders,
    addDocument, 
    updateDocument, 
    deleteDocument, 
    assignDocumentToActivity,
    addDocumentFolder,
    updateDocumentFolder,
    deleteDocumentFolder,
    moveDocumentsToFolder,
    bulkUpdateDocuments,
    bulkDeleteDocuments,
    workPackageBinders,
    addWorkPackageBinder,
    updateWorkPackageBinder,
    deleteWorkPackageBinder,
    toggleDocInWorkPackage,
    documentTransmittals,
    addDocumentTransmittal,
    updateDocumentTransmittal,
    deleteDocumentTransmittal,
    activities, 
    projects,
    currentUserProfile,
    hasPermission 
  } = useAppContext();

  const canEditDocuments = hasPermission('documents') || hasPermission('settings');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | DocumentCategory>('All');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | DocumentDiscipline>('All');
  const [selectedFileType, setSelectedFileType] = useState<'all' | DocumentFileType>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIssueStatus, setSelectedIssueStatus] = useState<'all' | DocumentIssueStatus>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(true);

  // Multi-Selection State for Bulk Operations
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // High-volume performance & tablet navigation state
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'size-desc' | 'size-asc' | 'category' | 'status'>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const [isMdrModalOpen, setIsMdrModalOpen] = useState(false);
  const [isWorkPackageModalOpen, setIsWorkPackageModalOpen] = useState(false);
  const [isTransmittalModalOpen, setIsTransmittalModalOpen] = useState(false);
  const [isTransmittalRegisterOpen, setIsTransmittalRegisterOpen] = useState(false);
  const [targetDocForRevision, setTargetDocForRevision] = useState<DocumentItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null);
  const [assignDoc, setAssignDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-open document from URL search param ?id=DOC-... or filter by category ?category=...
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId && documents.length > 0) {
      const match = documents.find(d => d.id === docId);
      if (match) {
        setPreviewDoc(match);
      }
    }
    const cat = searchParams.get('category');
    if (cat && (CATEGORIES as string[]).includes(cat)) {
      setSelectedCategory(cat as any);
    }
    const qa = searchParams.get('qaId');
    if (qa) {
      setSearchQuery(qa);
    }
  }, [searchParams, documents]);

  const activeProject = projects[0];

  // Active folder object & breadcrumb computation
  const activeFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return documentFolders.find(f => f.id === selectedFolderId) || null;
  }, [documentFolders, selectedFolderId]);

  const breadcrumbs = useMemo(() => {
    if (!activeFolder) return [{ id: null, name: 'All Documents' }];
    const chain: { id: string | null; name: string }[] = [{ id: activeFolder.id, name: activeFolder.name }];
    let current = activeFolder;
    while (current.parentId) {
      const parent = documentFolders.find(f => f.id === current.parentId);
      if (parent) {
        chain.unshift({ id: parent.id, name: parent.name });
        current = parent;
      } else {
        break;
      }
    }
    chain.unshift({ id: null, name: 'All Documents' });
    return chain;
  }, [activeFolder, documentFolders]);

  // Multi-term fast search & sorting
  const filteredAndSortedDocuments = useMemo(() => {
    const queryTokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);

    // Get all subfolder IDs if a folder is selected
    const folderMatchIds = new Set<string>();
    if (selectedFolderId) {
      folderMatchIds.add(selectedFolderId);
      documentFolders.forEach(f => {
        if (f.parentId === selectedFolderId) {
          folderMatchIds.add(f.id);
        }
      });
    }

    const filtered = documents.filter(doc => {
      // Folder filter
      if (selectedFolderId && (!doc.folderId || !folderMatchIds.has(doc.folderId))) {
        return false;
      }

      // Fast Tokenized Multi-Term Search
      if (queryTokens.length > 0) {
        const searchableText = `${doc.title} ${doc.fileName} ${doc.documentNumber || ''} ${doc.id} ${doc.description || ''} ${doc.uploadedBy} ${(doc.tags || []).join(' ')} ${doc.linkedActivityName || ''} ${doc.category} ${doc.discipline || ''} ${doc.status} ${doc.issueStatus || ''} ${doc.revision || ''}`.toLowerCase();
        const matchesAllTokens = queryTokens.every(token => searchableText.includes(token));
        if (!matchesAllTokens) return false;
      }

      // Discipline
      if (selectedDiscipline !== 'All' && doc.discipline !== selectedDiscipline) {
        return false;
      }

      // Category
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
        return false;
      }

      // File Type
      if (selectedFileType !== 'all' && doc.fileType !== selectedFileType) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
        return false;
      }

      // Issue Status (IFC, IFA, AB, SUP)
      if (selectedIssueStatus !== 'all' && doc.issueStatus !== selectedIssueStatus) {
        return false;
      }

      // Activity Link Filter
      if (activityFilter === 'assigned' && !doc.linkedActivityId) {
        return false;
      }
      if (activityFilter === 'unassigned' && doc.linkedActivityId) {
        return false;
      }

      return true;
    });

    // High-performance sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.uploadedAt || 0).getTime() - new Date(b.uploadedAt || 0).getTime();
        case 'date-desc':
          return new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'size-desc':
          return (b.fileSize || 0) - (a.fileSize || 0);
        case 'size-asc':
          return (a.fileSize || 0) - (b.fileSize || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
  }, [documents, selectedFolderId, documentFolders, searchQuery, selectedCategory, selectedDiscipline, selectedFileType, selectedStatus, selectedIssueStatus, activityFilter, sortBy]);

  // Auto-reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFolderId, selectedCategory, selectedDiscipline, selectedFileType, selectedStatus, selectedIssueStatus, activityFilter, sortBy, pageSize]);

  // Paginated Window for high-volume document performance
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedDocuments.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedDocuments = useMemo(() => {
    if (pageSize >= 99999) return filteredAndSortedDocuments;
    const start = (validCurrentPage - 1) * pageSize;
    return filteredAndSortedDocuments.slice(start, start + pageSize);
  }, [filteredAndSortedDocuments, validCurrentPage, pageSize]);

  const filteredDocuments = filteredAndSortedDocuments;

  // KPI Metrics Calculation
  const totalCount = documents.length;
  const ifcCount = documents.filter(d => d.issueStatus === 'IFC' || d.status === 'Approved').length;
  const ifaCount = documents.filter(d => d.issueStatus === 'IFA' || d.status === 'Under Review').length;
  const asBuiltCount = documents.filter(d => d.issueStatus === 'AB').length;
  const supersededCount = documents.filter(d => d.issueStatus === 'SUP' || d.status === 'Superseded').length;
  const drawingsCount = documents.filter(d => d.category === 'Drawings & Blueprints' || d.fileType === 'cad').length;

  // Multi-Selection Actions
  const toggleSelectDoc = (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedDocuments.map(d => d.id);
    const allSelected = pageIds.every(id => selectedDocIds.has(id));

    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleExportCSV = () => {
    exportDocumentsToCSV(
      filteredDocuments, 
      projects, 
      selectedCategory !== 'All' ? selectedCategory.replace(/\s+/g, '_').toLowerCase() : 'all'
    );
  };

  const handleDownloadSingle = async (doc: DocumentItem) => {
    await downloadDocument(doc);
  };

  const getFormatBadge = (fileType: DocumentFileType, ext: string) => {
    switch (fileType) {
      case 'excel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold uppercase">
            <FileSpreadsheet className="h-3 w-3" />
            {ext}
          </span>
        );
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-[10px] font-mono font-bold uppercase">
            <FileText className="h-3 w-3" />
            {ext}
          </span>
        );
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-bold uppercase">
            <ImageIcon className="h-3 w-3" />
            {ext}
          </span>
        );
      case 'cad':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 text-[10px] font-mono font-bold uppercase">
            <Layers className="h-3 w-3" />
            {ext}
          </span>
        );
      case 'word':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold uppercase">
            <FileCode className="h-3 w-3" />
            {ext}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold uppercase">
            <FileCode className="h-3 w-3" />
            {ext}
          </span>
        );
    }
  };

  const getStatusBadge = (status: DocumentStatus, issueStatus?: DocumentIssueStatus) => {
    if (issueStatus === 'IFC' || status === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
          <CheckCircle2 className="h-3 w-3" />
          IFC Approved
        </span>
      );
    }
    if (issueStatus === 'IFA' || status === 'Under Review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px] font-bold">
          <Clock className="h-3 w-3" />
          IFA In Review
        </span>
      );
    }
    if (issueStatus === 'SUP' || status === 'Superseded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 text-[11px] font-bold">
          Superseded
        </span>
      );
    }
    if (issueStatus === 'AB') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[11px] font-bold">
          As-Built
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[11px] font-bold">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-8 pb-20 relative">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#0B5FFF] shadow-xs">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Documents Hub & Control
                </h1>
                <Badge variant="outline" className="text-[10px] font-mono uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-600 border-teal-200 dark:border-teal-800">
                  ISO 19650 EDMS
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized drawing register, revision tracking, IFC certification, folder tree, and batch ingestion.
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsMdrModalOpen(true)}
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm"
            title="Open Executive Master Document Register (MDR) Studio"
          >
            <FileCheck className="h-4 w-4 text-teal-400 dark:text-teal-600" />
            <span>MDR Studio</span>
          </Button>

          <Button
            onClick={() => setIsWorkPackageModalOpen(true)}
            variant="outline"
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 shadow-2xs"
            title="Manage Work Package Binders & Site Execution Dossiers"
          >
            <Briefcase className="h-4 w-4" />
            <span>Work Packages ({workPackageBinders.length})</span>
          </Button>

          <Button
            onClick={() => setIsTransmittalRegisterOpen(true)}
            variant="outline"
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 shadow-2xs"
            title="View Document Transmittal Register (DTN Log)"
          >
            <Send className="h-4 w-4" />
            <span>Transmittals ({documentTransmittals.length})</span>
          </Button>

          {canEditDocuments && (
            <Button
              variant="outline"
              onClick={() => setIsBatchUploadOpen(true)}
              className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800 bg-teal-50/50 hover:bg-teal-100 dark:hover:bg-teal-950/60 shadow-2xs"
              title="Upload 50+ files in bulk with auto-metadata parsing"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Batch Upload</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Export full document register to Excel / CSV"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          {canEditDocuments && (
            <Button
              onClick={() => {
                setTargetDocForRevision(null);
                setIsUploadOpen(true);
              }}
              className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-bold text-xs sm:text-sm shadow-sm gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Upload Document</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Docs</div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Project Archive</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">IFC Approved</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{ifcCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Construction Ready</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">IFA In Review</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{ifaCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending Signoff</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">As-Built Survey</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">{asBuiltCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Survey Verified</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Drawings & CAD</div>
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">{drawingsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Plans & Blueprints</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Superseded</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{supersededCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Archived Revisions</div>
        </div>
      </div>

      {/* Main Multi-Column Workstation Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Hierarchical Folder Tree Sidebar */}
        <div className={`transition-all duration-200 shrink-0 ${
          isFolderSidebarOpen ? 'w-full lg:w-72 xl:w-80' : 'w-full lg:w-16'
        }`}>
          <DocumentFolderTree
            folders={documentFolders}
            documents={documents}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(folderId) => setSelectedFolderId(folderId)}
            onAddFolder={(newFolder) => addDocumentFolder(newFolder)}
            onUpdateFolder={(updatedFolder) => updateDocumentFolder(updatedFolder)}
            onDeleteFolder={(folderId) => deleteDocumentFolder(folderId)}
            canEdit={canEditDocuments}
            isCollapsed={!isFolderSidebarOpen}
            onToggleCollapse={() => setIsFolderSidebarOpen(!isFolderSidebarOpen)}
          />
        </div>

        {/* Right Column: File Explorer, Filter Bar & Document Grids */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          
          {/* Breadcrumbs & Folder Header Bar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsFolderSidebarOpen(!isFolderSidebarOpen)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 mr-1"
                title={isFolderSidebarOpen ? 'Collapse Folder Sidebar' : 'Expand Folder Sidebar'}
              >
                <Sidebar className="h-4 w-4" />
              </button>

              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(crumb.id)}
                    className={`font-semibold hover:text-[#0B5FFF] transition-colors ${
                      idx === breadcrumbs.length - 1
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 font-bold">
                {filteredAndSortedDocuments.length} Files
              </span>

              {/* Select All Toggle */}
              {paginatedDocuments.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllOnPage}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1"
                >
                  {paginatedDocuments.every(d => selectedDocIds.has(d.id)) ? (
                    <>
                      <CheckSquare className="h-3.5 w-3.5 text-[#0B5FFF]" />
                      <span>Deselect Page</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-3.5 w-3.5" />
                      <span>Select Page</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            
            {/* Quick Issue Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1.5 shrink-0">Issue Status:</span>
              {[
                { key: 'all', label: 'All Statuses' },
                { key: 'IFC', label: 'IFC (Construction Ready)' },
                { key: 'IFA', label: 'IFA (In Review)' },
                { key: 'AB', label: 'As-Built' },
                { key: 'SUP', label: 'Superseded' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedIssueStatus(tab.key as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 text-xs border ${
                    selectedIssueStatus === tab.key
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-[#0B5FFF] text-[#0B5FFF]'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Input & Mobile Filter Toggle */}
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by drawing number, title, discipline, author, activity..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className={`lg:hidden flex items-center gap-1.5 px-3 h-10 rounded-xl border text-xs font-bold transition-colors shrink-0 ${
                    showFiltersMobile
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-[#0B5FFF]'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                  title="Toggle Filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>

              {/* Controls: Sort By, Discipline, Category, Format, Activity, View Mode */}
              <div className={`flex items-center gap-2 flex-wrap ${showFiltersMobile ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* Discipline Dropdown */}
                <div className="w-36 sm:w-40">
                  <CustomSelect
                    value={selectedDiscipline}
                    onChange={(val) => setSelectedDiscipline(val as any)}
                    options={DISCIPLINES.map(d => ({ value: d, label: d === 'All' ? 'All Disciplines' : d }))}
                    className="w-full"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="w-36 sm:w-40">
                  <CustomSelect
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val as any)}
                    options={CATEGORIES.map(c => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
                    className="w-full"
                  />
                </div>

                {/* File Type Dropdown */}
                <div className="w-32 sm:w-36">
                  <CustomSelect
                    value={selectedFileType}
                    onChange={(val) => setSelectedFileType(val as any)}
                    options={[
                      { value: 'all', label: 'All Formats' },
                      { value: 'pdf', label: 'PDF Documents' },
                      { value: 'excel', label: 'Excel / CSV' },
                      { value: 'cad', label: 'CAD & Blueprints' },
                      { value: 'word', label: 'Word (.docx)' },
                      { value: 'image', label: 'Images' }
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Activity Link Filter */}
                <div className="w-32 sm:w-36">
                  <CustomSelect
                    value={activityFilter}
                    onChange={(val) => setActivityFilter(val as any)}
                    options={[
                      { value: 'all', label: 'All Tasks' },
                      { value: 'assigned', label: 'Linked to Tasks' },
                      { value: 'unassigned', label: 'Unassigned' }
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Grid / Table Toggle */}
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

              </div>
            </div>

            {/* Active Filter Chips */}
            {(selectedCategory !== 'All' || selectedDiscipline !== 'All' || selectedFileType !== 'all' || selectedStatus !== 'all' || selectedIssueStatus !== 'all' || activityFilter !== 'all' || searchQuery || selectedFolderId) && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Active filters:</span>
                {selectedFolderId && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                    Folder: {activeFolder?.name || selectedFolderId}
                    <button onClick={() => setSelectedFolderId(null)} className="hover:text-red-500">×</button>
                  </span>
                )}
                {selectedDiscipline !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                    Discipline: {selectedDiscipline}
                    <button onClick={() => setSelectedDiscipline('All')} className="hover:text-red-500">×</button>
                  </span>
                )}
                {selectedIssueStatus !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                    Issue: {selectedIssueStatus}
                    <button onClick={() => setSelectedIssueStatus('all')} className="hover:text-red-500">×</button>
                  </span>
                )}
                {selectedCategory !== 'All' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500">×</button>
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} className="hover:text-red-500">×</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFolderId(null);
                    setSelectedCategory('All');
                    setSelectedDiscipline('All');
                    setSelectedFileType('all');
                    setSelectedStatus('all');
                    setSelectedIssueStatus('all');
                    setActivityFilter('all');
                    setSortBy('date-desc');
                  }}
                  className="text-[#0B5FFF] hover:underline font-bold ml-1"
                >
                  Reset all
                </button>
              </div>
            )}

          </div>

          {/* Main Content: Grid or Table View */}
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#0B5FFF] inline-block mb-3">
                <FolderOpen className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No documents in this view</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                No files matched your active folder, filter, or search query. You can reset filters or upload documents.
              </p>
              {canEditDocuments && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => setIsBatchUploadOpen(true)}
                    className="rounded-xl px-4 py-2 font-bold text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    <UploadCloud className="h-4 w-4 mr-1.5" />
                    <span>Batch Upload Files</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setTargetDocForRevision(null);
                      setIsUploadOpen(true);
                    }}
                    className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span>Upload Single Document</span>
                  </Button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            
            /* Grid Layout */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedDocuments.map((doc) => {
                  const hasActivity = !!doc.linkedActivityId;
                  const isChecked = selectedDocIds.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group relative ${
                        isChecked 
                          ? 'border-[#0B5FFF] ring-2 ring-blue-500/20 shadow-md' 
                          : 'border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="p-4 space-y-3">
                        
                        {/* Card Header Top */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Multi-Select Checkbox */}
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectDoc(doc.id)}
                              className="rounded text-[#0B5FFF] h-4 w-4 cursor-pointer"
                            />
                            {getFormatBadge(doc.fileType, doc.fileExtension)}
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                              {doc.documentNumber || doc.id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 font-mono">
                              {doc.revision || doc.version || 'Rev 0'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {getStatusBadge(doc.status, doc.issueStatus)}
                          </div>
                        </div>

                        {/* Title & File Name */}
                        <div>
                          <h3
                            onClick={() => setPreviewDoc(doc)}
                            className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#0B5FFF] dark:hover:text-blue-400 cursor-pointer line-clamp-1 transition-colors"
                            title={doc.title}
                          >
                            {doc.title}
                          </h3>
                          <div className="text-xs text-slate-500 font-mono truncate mt-0.5 flex items-center gap-1.5">
                            <span>{doc.fileName}</span>
                            <span>•</span>
                            <span>{doc.fileSizeFormatted || '1.2 MB'}</span>
                          </div>
                        </div>

                        {/* Discipline & Category */}
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                          {doc.discipline && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px]">
                              {doc.discipline}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500">{doc.category}</span>
                        </div>

                        {/* Linked Activity Badge */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <LinkIcon className="h-3 w-3 text-blue-500" />
                              Activity
                            </span>
                            {canEditDocuments && (
                              <button
                                onClick={() => setAssignDoc(doc)}
                                className="text-[10px] text-[#0B5FFF] hover:underline font-bold"
                              >
                                {hasActivity ? 'Change' : '+ Assign'}
                              </button>
                            )}
                          </div>

                          {hasActivity ? (
                            <div
                              onClick={() => canEditDocuments && setAssignDoc(doc)}
                              className={`mt-1 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between gap-2 ${canEditDocuments ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                                  {doc.linkedActivityName}
                                </div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  {doc.linkedActivityId}
                                </div>
                              </div>
                              <LinkIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            </div>
                          ) : (
                            <div
                              onClick={() => canEditDocuments && setAssignDoc(doc)}
                              className={`mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center ${canEditDocuments ? 'cursor-pointer hover:border-[#0B5FFF] transition-colors' : ''}`}
                            >
                              <span className="text-[10px] text-slate-400 italic">
                                {canEditDocuments ? 'Click to link document to activity' : 'No activity linked'}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Card Action Footer */}
                      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-400 truncate max-w-[110px]">
                          {doc.uploadedBy.split(' ')[0]} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : '-'}
                        </div>

                        <div className="flex items-center gap-1">
                          {canEditDocuments && (
                            <button
                              onClick={() => {
                                setTargetDocForRevision(doc);
                                setIsUploadOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[10px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors"
                              title="Upload new revision for this document"
                            >
                              <GitBranch className="h-3 w-3" />
                              <span>Rev</span>
                            </button>
                          )}

                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(doc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {canEditDocuments && (
                            <>
                              <button
                                onClick={() => setEditDoc(doc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
                                title="Edit Document"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(doc.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete Document"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            
            /* Table View */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={paginatedDocuments.length > 0 && paginatedDocuments.every(d => selectedDocIds.has(d.id))}
                          onChange={handleSelectAllOnPage}
                          className="rounded text-[#0B5FFF] h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">Drawing / Doc No</th>
                      <th className="p-3.5">Document Title & File</th>
                      <th className="p-3.5">Discipline</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Revision</th>
                      <th className="p-3.5">Issue Purpose</th>
                      <th className="p-3.5">Activity</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedDocuments.map((doc) => {
                      const isChecked = selectedDocIds.has(doc.id);

                      return (
                        <tr key={doc.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isChecked ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                          <td className="p-3.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectDoc(doc.id)}
                              className="rounded text-[#0B5FFF] h-4 w-4 cursor-pointer"
                            />
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{doc.documentNumber || doc.id}</div>
                            <div className="mt-1">{getFormatBadge(doc.fileType, doc.fileExtension)}</div>
                          </td>

                          <td className="p-3.5 max-w-xs">
                            <div
                              onClick={() => setPreviewDoc(doc)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#0B5FFF] cursor-pointer"
                            >
                              {doc.title}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">{doc.fileName} ({doc.fileSizeFormatted || '1.2 MB'})</div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                            {doc.discipline || 'General'}
                          </td>

                          <td className="p-3.5 whitespace-nowrap font-medium text-slate-500 text-[11px]">
                            {doc.category}
                          </td>

                          <td className="p-3.5 whitespace-nowrap font-mono font-bold text-blue-600">
                            {doc.revision || doc.version || 'Rev 0'}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            {getStatusBadge(doc.status, doc.issueStatus)}
                          </td>

                          <td className="p-3.5">
                            {doc.linkedActivityName ? (
                              <div
                                onClick={() => setAssignDoc(doc)}
                                className="cursor-pointer group flex items-center gap-1.5"
                              >
                                <span className="font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                                  {doc.linkedActivityName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">({doc.linkedActivityId})</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssignDoc(doc)}
                                className="text-[11px] text-slate-400 hover:text-[#0B5FFF] italic flex items-center gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Assign</span>
                              </button>
                            )}
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {canEditDocuments && (
                                <button
                                  onClick={() => {
                                    setTargetDocForRevision(doc);
                                    setIsUploadOpen(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-[10px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors mr-1"
                                  title="New Revision"
                                >
                                  <GitBranch className="h-3 w-3" />
                                  <span>Rev</span>
                                </button>
                              )}
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                title="Preview"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadSingle(doc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              {canEditDocuments && (
                                <>
                                  <button
                                    onClick={() => setEditDoc(doc)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Edit"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(doc.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredAndSortedDocuments.length > 0 && totalPages > 1 && (
            <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Showing <span className="font-bold text-slate-900 dark:text-white">{(validCurrentPage - 1) * pageSize + 1}</span>–<span className="font-bold text-slate-900 dark:text-white">{Math.min(validCurrentPage * pageSize, filteredAndSortedDocuments.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredAndSortedDocuments.length}</span> documents • Page <span className="font-bold text-[#0B5FFF]">{validCurrentPage}</span> of <span className="font-bold">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={validCurrentPage === 1}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || (p >= validCurrentPage - 2 && p <= validCurrentPage + 2))
                  .map((pageNum, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && pageNum - prevPage > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {showEllipsis && (
                          <span className="px-2 text-slate-400 font-bold select-none">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-xl font-bold text-xs transition-colors flex items-center justify-center ${
                            pageNum === validCurrentPage
                              ? 'bg-[#0B5FFF] text-white shadow-xs'
                              : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Floating Bulk Action Bar */}
      <DocumentBulkActionBar
        selectedDocIds={Array.from(selectedDocIds)}
        allDocuments={documents}
        folders={documentFolders}
        onClearSelection={() => setSelectedDocIds(new Set())}
        onMoveToFolder={(targetFolderId) => {
          moveDocumentsToFolder(Array.from(selectedDocIds), targetFolderId);
          setSelectedDocIds(new Set());
        }}
        onBulkUpdateStatus={(issueStatus) => {
          bulkUpdateDocuments(Array.from(selectedDocIds), { 
            issueStatus, 
            status: issueStatus === 'SUP' ? 'Superseded' : (issueStatus === 'IFC' ? 'Approved' : 'Under Review') 
          });
          setSelectedDocIds(new Set());
        }}
        onBulkDelete={() => {
          bulkDeleteDocuments(Array.from(selectedDocIds));
          setSelectedDocIds(new Set());
        }}
        onOpenTransmittalModal={() => setIsTransmittalModalOpen(true)}
      />

      {/* Delete Single Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 w-fit">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Delete Project Document?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this document from the project archive? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl px-3.5 py-1.5 font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteDocument(deleteConfirmId);
                  deleteDocumentFile(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-1.5 font-semibold text-xs shadow-xs"
              >
                Delete File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Single Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setTargetDocForRevision(null);
        }}
        onUpload={(newDoc) => {
          if (documents.some(d => d.id === newDoc.id)) {
            updateDocument(newDoc);
          } else {
            addDocument(newDoc);
          }
        }}
        activities={activities}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        projectId={activeProject?.id || 'PRJ-001'}
        existingDocuments={documents}
        initialTargetDocForRevision={targetDocForRevision}
        defaultCategory={selectedCategory !== 'All' ? selectedCategory : undefined}
      />

      {/* Multi-File Batch Upload Modal */}
      <DocumentBatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        onUploadBatch={(batchDocs) => {
          batchDocs.forEach(doc => addDocument(doc));
        }}
        folders={documentFolders}
        activities={activities}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        projectId={activeProject?.id || 'PRJ-001'}
        defaultFolderId={selectedFolderId}
      />

      {/* Preview Modal with Cross-References & Work Packages */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        activities={activities}
        allDocuments={documents}
        workPackageBinders={workPackageBinders}
        onEdit={(doc) => setEditDoc(doc)}
        onAssignActivity={(doc) => setAssignDoc(doc)}
        onUploadNewRevision={(doc) => {
          setTargetDocForRevision(doc);
          setIsUploadOpen(true);
        }}
      />

      {/* Edit Modal */}
      <DocumentEditModal
        isOpen={!!editDoc}
        onClose={() => setEditDoc(null)}
        document={editDoc}
        onSave={(updated) => updateDocument(updated)}
        activities={activities}
      />

      {/* Quick Activity Assign Modal */}
      <DocumentActivityAssignModal
        isOpen={!!assignDoc}
        onClose={() => setAssignDoc(null)}
        document={assignDoc}
        activities={activities}
        onAssign={(docId, actId, actName) => assignDocumentToActivity(docId, actId, actName)}
      />

      {/* Master Document Register (MDR) Studio Modal */}
      <MasterDocumentRegisterModal
        isOpen={isMdrModalOpen}
        onClose={() => setIsMdrModalOpen(false)}
        documents={documents}
        projects={projects}
      />

      {/* Work Package Binders & Site Dossiers Manager */}
      <WorkPackageBindersModal
        isOpen={isWorkPackageModalOpen}
        onClose={() => setIsWorkPackageModalOpen(false)}
        binders={workPackageBinders}
        documents={documents}
        activities={activities}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        onAddBinder={addWorkPackageBinder}
        onUpdateBinder={updateWorkPackageBinder}
        onDeleteBinder={deleteWorkPackageBinder}
        onToggleDocInBinder={toggleDocInWorkPackage}
        canEdit={canEditDocuments}
      />

      {/* Issue Document Transmittal Notice (DTN) Modal */}
      <DocumentTransmittalModal
        isOpen={isTransmittalModalOpen}
        onClose={() => setIsTransmittalModalOpen(false)}
        documents={documents}
        initialSelectedDocIds={Array.from(selectedDocIds)}
        projects={projects}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        onIssueTransmittal={(transmittal) => {
          addDocumentTransmittal(transmittal);
          // Mark transmittalNumber on documents
          bulkUpdateDocuments(transmittal.documentIds, { transmittalNumber: transmittal.transmittalNumber });
        }}
      />

      {/* Historical Transmittal Register (DTN Log) Modal */}
      <TransmittalRegisterModal
        isOpen={isTransmittalRegisterOpen}
        onClose={() => setIsTransmittalRegisterOpen(false)}
        transmittals={documentTransmittals}
        projects={projects}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        onDeleteTransmittal={deleteDocumentTransmittal}
        canEdit={canEditDocuments}
      />

    </div>
  );
}
export default Documents;
