import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Button, CustomSelect } from '../components/ui';
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
  Check,
  AlertCircle,
  Unlink
} from 'lucide-react';
import { DocumentCategory, DocumentFileType, DocumentItem, DocumentStatus } from '../types';
import { printDocumentsSummary } from '../lib/pdfPrint';
import { exportDocumentsToCSV } from '../lib/csvExport';
import { downloadDocument, deleteDocumentFile } from '../lib/documentStorage';
import { DocumentUploadModal } from '../components/documents/DocumentUploadModal';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';
import { DocumentEditModal } from '../components/documents/DocumentEditModal';
import { DocumentActivityAssignModal } from '../components/documents/DocumentActivityAssignModal';

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

export function Documents() {
  const { 
    documents, 
    addDocument, 
    updateDocument, 
    deleteDocument, 
    assignDocumentToActivity,
    activities, 
    projects,
    currentUserProfile,
    hasPermission 
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DocumentCategory>('All');
  const [selectedFileType, setSelectedFileType] = useState<'all' | DocumentFileType>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [searchParams, setSearchParams] = useSearchParams();

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null);
  const [assignDoc, setAssignDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-open document from URL search param ?id=DOC-...
  useEffect(() => {
    const docId = searchParams.get('id');
    if (docId && documents.length > 0) {
      const match = documents.find(d => d.id === docId);
      if (match) {
        setPreviewDoc(match);
      }
    }
  }, [searchParams, documents]);

  const activeProject = projects[0];

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesFile = doc.fileName.toLowerCase().includes(q);
        const matchesId = doc.id.toLowerCase().includes(q);
        const matchesDesc = (doc.description || '').toLowerCase().includes(q);
        const matchesAuthor = doc.uploadedBy.toLowerCase().includes(q);
        const matchesTags = (doc.tags || []).some(t => t.toLowerCase().includes(q));
        const matchesActivity = (doc.linkedActivityName || '').toLowerCase().includes(q);

        if (!matchesTitle && !matchesFile && !matchesId && !matchesDesc && !matchesAuthor && !matchesTags && !matchesActivity) {
          return false;
        }
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

      // Activity Link Filter
      if (activityFilter === 'assigned' && !doc.linkedActivityId) {
        return false;
      }
      if (activityFilter === 'unassigned' && doc.linkedActivityId) {
        return false;
      }

      return true;
    });
  }, [documents, searchQuery, selectedCategory, selectedFileType, selectedStatus, activityFilter]);

  // KPI Metrics Calculation
  const totalCount = documents.length;
  const approvedCount = documents.filter(d => d.status === 'Approved').length;
  const underReviewCount = documents.filter(d => d.status === 'Under Review').length;
  const assignedCount = documents.filter(d => !!d.linkedActivityId).length;
  const drawingsCount = documents.filter(d => d.category === 'Drawings & Blueprints' || d.fileType === 'cad').length;
  const spreadsheetsCount = documents.filter(d => d.fileType === 'excel').length;

  const handlePrint = () => {
    printDocumentsSummary({
      project: activeProject,
      documents: filteredDocuments,
      filterLabel: selectedCategory !== 'All' ? selectedCategory : 'Full Document Register',
      totalDocumentsCount: totalCount
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

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[11px] font-bold">
            <Clock className="h-3 w-3" />
            Under Review
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 text-[11px] font-bold">
            Draft
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 text-[11px] font-bold">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 pb-12">
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#0B5FFF]">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Documents Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Centralized register for drawings, technical specs, spreadsheets, and contracts with activity linking.
              </p>
            </div>
          </div>
        </div>

        {/* Global Hub Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Generate executive PDF printout of document register"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Register</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="rounded-xl px-3.5 py-2 font-bold text-xs sm:text-sm gap-2 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Export full document register to Excel / CSV"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-bold text-xs sm:text-sm shadow-sm gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">IFC & Verified</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">In Review</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{underReviewCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending Signoff</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0B5FFF]">Activity Linked</div>
          <div className="text-xl font-bold text-[#0B5FFF] mt-1">{assignedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Assigned to Tasks</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Drawings & CAD</div>
          <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">{drawingsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Plans & Blueprints</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Spreadsheets</div>
          <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{spreadsheetsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">BOQ & Excel Logs</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, file name, tags, author, or linked activity..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
            />
          </div>

          {/* Controls: Category, File Type, Status, Activity, View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Category Dropdown */}
            <div className="w-44">
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val as any)}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                className="w-full"
              />
            </div>

            {/* File Type Dropdown */}
            <div className="w-36">
              <CustomSelect
                value={selectedFileType}
                onChange={(val) => setSelectedFileType(val as any)}
                options={[
                  { value: 'all', label: 'All Formats' },
                  { value: 'pdf', label: 'PDF Documents' },
                  { value: 'excel', label: 'Excel / CSV' },
                  { value: 'cad', label: 'CAD & Drawings' },
                  { value: 'word', label: 'Word (.docx)' },
                  { value: 'image', label: 'Images' }
                ]}
                className="w-full"
              />
            </div>

            {/* Activity Link Filter */}
            <div className="w-40">
              <CustomSelect
                value={activityFilter}
                onChange={(val) => setActivityFilter(val as any)}
                options={[
                  { value: 'all', label: 'All Assignments' },
                  { value: 'assigned', label: 'Linked to Activity' },
                  { value: 'unassigned', label: 'Unassigned Only' }
                ]}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <div className="w-36">
              <CustomSelect
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Under Review', label: 'Under Review' },
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Archived', label: 'Archived' }
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
        {(selectedCategory !== 'All' || selectedFileType !== 'all' || selectedStatus !== 'all' || activityFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                Keyword: &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500">×</button>
              </span>
            )}
            {selectedCategory !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500">×</button>
              </span>
            )}
            {selectedFileType !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                Format: {selectedFileType.toUpperCase()}
                <button onClick={() => setSelectedFileType('all')} className="hover:text-red-500">×</button>
              </span>
            )}
            {activityFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF] font-medium flex items-center gap-1">
                {activityFilter === 'assigned' ? 'Linked to Activity' : 'Unassigned'}
                <button onClick={() => setActivityFilter('all')} className="hover:text-red-500">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedFileType('all');
                setSelectedStatus('all');
                setActivityFilter('all');
              }}
              className="text-[#0B5FFF] hover:underline font-bold ml-1"
            >
              Reset all
            </button>
          </div>
        )}

      </div>

      {/* Main Content Area: Grid View or Table View */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#0B5FFF] inline-block mb-3">
            <FolderOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No documents found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            No files matched your search or active filter combination. You can adjust your filters or upload a new project document.
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl px-4 py-2 font-bold text-xs gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const hasActivity = !!doc.linkedActivityId;

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-4.5 space-y-3">
                  
                  {/* Card Header Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getFormatBadge(doc.fileType, doc.fileExtension)}
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{doc.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                        {doc.version}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {getStatusBadge(doc.status)}
                      {doc.confidential && (
                        <span title="Confidential" className="p-1 text-red-500">
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </span>
                      )}
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

                  {/* Category Pill */}
                  <div className="text-xs text-slate-500 font-medium">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.category}</span>
                  </div>

                  {/* Linked Activity Badge / Button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <LinkIcon className="h-3 w-3 text-blue-500" />
                        Activity
                      </span>
                      <button
                        onClick={() => setAssignDoc(doc)}
                        className="text-[11px] text-[#0B5FFF] hover:underline font-bold"
                      >
                        {hasActivity ? 'Change' : '+ Assign'}
                      </button>
                    </div>

                    {hasActivity ? (
                      <div
                        onClick={() => setAssignDoc(doc)}
                        className="mt-1 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 cursor-pointer hover:border-blue-300 transition-colors flex items-center justify-between gap-2"
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
                        onClick={() => setAssignDoc(doc)}
                        className="mt-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:border-[#0B5FFF] transition-colors"
                      >
                        <span className="text-[11px] text-slate-400 italic">
                          Click to link this document to an activity
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 3).map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold"
                        >
                          #{t}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px]">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                </div>

                {/* Card Action Footer */}
                <div className="px-4.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {doc.uploadedBy.split(' ')[0]} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : '-'}
                  </div>

                  <div className="flex items-center gap-1">
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
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        /* Table View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5">ID / Format</th>
                  <th className="p-3.5">Document Title & File</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Assigned Activity</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Uploader</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{doc.id}</div>
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
                      {doc.category}
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

                    <td className="p-3.5 whitespace-nowrap font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {doc.version}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                    </td>

                    <td className="p-3.5 whitespace-nowrap text-slate-500">
                      <div>{doc.uploadedBy}</div>
                      <div className="text-[10px] text-slate-400">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : '-'}</div>
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 w-fit">
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

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(newDoc) => addDocument(newDoc)}
        activities={activities}
        currentUser={currentUserProfile?.name || 'Lindokuhle Chris (Admin)'}
        projectId={activeProject?.id || 'PRJ-9348'}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        activities={activities}
        onEdit={(doc) => setEditDoc(doc)}
        onAssignActivity={(doc) => setAssignDoc(doc)}
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

    </div>
  );
}
export default Documents;
