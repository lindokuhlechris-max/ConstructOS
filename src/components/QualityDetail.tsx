import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from './ui';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Check, 
  Building2, 
  Trash2, 
  FileCheck, 
  Award,
  Clock,
  Layers,
  Edit3,
  UserCheck,
  Printer,
  FolderOpen,
  UploadCloud,
  FileSpreadsheet,
  FileCode,
  Link as LinkIcon,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Unlink,
  HardDrive,
  Tag,
  Paperclip,
  CheckCircle,
  MessageSquare,
  StickyNote,
  Send,
  CornerDownLeft,
  Save,
  MessageCircle,
  Sparkles,
  Clock3,
  Ruler,
  Scale,
  Percent,
  Sliders,
  CheckSquare
} from 'lucide-react';
import { QAInspectionItem, DocumentItem, DocumentCategory, canManage, canUserEditSection, Comment } from '../types';
import { useAppContext } from '../context/AppContext';
import { DocumentUploadModal } from './documents/DocumentUploadModal';
import { DocumentPreviewModal } from './documents/DocumentPreviewModal';
import { downloadDocument } from '../lib/documentStorage';
import { formatFileSize } from '../lib/documentUtils';
import { QAMeasurementModal } from './QAMeasurementModal';

interface QualityDetailProps {
  inspection: QAInspectionItem;
  onSave: (updated: QAInspectionItem) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function QualityDetail({ inspection, onSave, onClose, onDelete }: QualityDetailProps) {
  const navigate = useNavigate();
  const { activities, projects, documents, employees, addDocument, updateDocument, userRole, currentUserProfile } = useAppContext();
  const canEditQuality = canUserEditSection(currentUserProfile, 'quality');

  const employeeInspectorOptions = (employees && employees.length > 0)
    ? employees.map(emp => ({
        value: `${emp.firstName} ${emp.lastName}`.trim(),
        label: `${emp.firstName} ${emp.lastName}${emp.position ? ` — ${emp.position}` : ''}${emp.department ? ` (${emp.department})` : ''}`
      }))
    : [
        { value: 'Advocate', label: 'Advocate (QA/QC Inspector)' },
        { value: 'David Smith (QA Engineer)', label: 'David Smith (Lead QA Engineer)' },
        { value: 'Michael Moyo', label: 'Michael Moyo (Civil QC Foreman)' },
        { value: 'Lerato Khumalo', label: 'Lerato Khumalo (QC Inspector)' }
      ];
  const [activeTab, setActiveTab] = useState<'overview' | 'measurements' | 'ncr' | 'tests' | 'documents' | 'photos'>('overview');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

  // Comments and Notes State
  const [activeSideTab, setActiveSideTab] = useState<'comments' | 'notes'>('comments');
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [quickNoteText, setQuickNoteText] = useState<string>(() => {
    if (inspection.notes) return inspection.notes;
    try {
      const saved = localStorage.getItem(`constructos_qa_notes_${inspection.id}`);
      if (saved) return saved;
    } catch {}
    return '';
  });
  const [notesSaveStatus, setNotesSaveStatus] = useState<string>('');

  const [comments, setComments] = useState<Comment[]>(() => {
    if (inspection.comments && inspection.comments.length > 0) return inspection.comments;
    try {
      const saved = localStorage.getItem(`constructos_qa_comments_${inspection.id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: `CMT-QA-${inspection.id}-1`,
        author: inspection.inspector || 'David Smith (QA Engineer)',
        userRole: 'QA Inspector',
        userInitials: 'DS',
        text: `Inspection recorded for ${inspection.title} at ${inspection.location}. Site parameters verified against engineering specification.`,
        timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
      }
    ];
  });

  // Modals state
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isNCRModalOpen, setIsNCRModalOpen] = useState(false);
  const [isAddMetricModalOpen, setIsAddMetricModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Document Integration state
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [isLinkExistingDocModalOpen, setIsLinkExistingDocModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | 'pdf' | 'excel' | 'image' | 'cad' | 'other'>('all');
  const [existingDocSearch, setExistingDocSearch] = useState('');
  const [uploadModalCategory, setUploadModalCategory] = useState<DocumentCategory>('QA/QC Inspections');

  // Edit Inspection State
  const [editForm, setEditForm] = useState<Partial<QAInspectionItem>>({
    title: inspection.title,
    category: inspection.category,
    location: inspection.location,
    inspector: inspection.inspector,
    date: inspection.date,
    inspectionTime: inspection.inspectionTime || '',
    client: inspection.client || '',
    epc: inspection.epc || '',
    subcontractor: inspection.subcontractor || '',
    documentNumber: inspection.documentNumber || '',
    referenceDrawingNumber: inspection.referenceDrawingNumber || '',
    activityId: inspection?.activityId,
    clientQCRepresentative: inspection.clientQCRepresentative || '',
    clientQCStatus: inspection.clientQCStatus || 'Pending Client Review',
    clientQCNotes: inspection.clientQCNotes || '',
    clientQCSignoffDate: inspection.clientQCSignoffDate || new Date().toISOString().split('T')[0]
  });

  // Comments and Notes Handlers
  const handlePostComment = () => {
    if (!newCommentText.trim()) return;

    const authorName = currentUserProfile?.name || (userRole === 'Admin' ? 'Administrator' : 'Current User');
    const authorId = currentUserProfile?.id || 'current-user';
    const authorRole = currentUserProfile?.role || userRole || 'Inspector';
    const authorInitials = currentUserProfile?.initials || authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const authorAvatar = currentUserProfile?.avatarUrl;

    const newComment: Comment = {
      id: `CMT-QA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author: authorName,
      userId: authorId,
      userRole: authorRole,
      userInitials: authorInitials,
      text: newCommentText.trim(),
      timestamp: new Date().toISOString(),
      avatar: authorAvatar
    };

    const updatedComments = [...comments, newComment];
    setComments(updatedComments);
    setNewCommentText('');

    try {
      localStorage.setItem(`constructos_qa_comments_${inspection.id}`, JSON.stringify(updatedComments));
    } catch {}

    onSave({
      ...inspection,
      comments: updatedComments
    });
  };

  const handleDeleteComment = (commentId: string) => {
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    const currentUserName = currentUserProfile?.name || 'Current User';
    const currentUserId = currentUserProfile?.id;
    const isAuthor = Boolean(
      (currentUserId && commentToDelete.userId && commentToDelete.userId === currentUserId) || 
      (commentToDelete.author && commentToDelete.author.toLowerCase() === currentUserName.toLowerCase())
    );
    const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager' || 
      currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Manager';

    if (!isAuthor && !isAdminOrManager) {
      alert('Permission Denied: You can only delete your own comments.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const updatedComments = comments.filter(c => c.id !== commentId);
    setComments(updatedComments);

    try {
      localStorage.setItem(`constructos_qa_comments_${inspection.id}`, JSON.stringify(updatedComments));
    } catch {}

    onSave({
      ...inspection,
      comments: updatedComments
    });
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;

    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          text: editingCommentText.trim(),
          editedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setComments(updatedComments);
    setEditingCommentId(null);
    setEditingCommentText('');

    try {
      localStorage.setItem(`constructos_qa_comments_${inspection.id}`, JSON.stringify(updatedComments));
    } catch {}

    onSave({
      ...inspection,
      comments: updatedComments
    });
  };

  const handleSaveNotes = () => {
    try {
      localStorage.setItem(`constructos_qa_notes_${inspection.id}`, quickNoteText);
    } catch {}

    onSave({
      ...inspection,
      notes: quickNoteText
    });

    setNotesSaveStatus('Saved!');
    setTimeout(() => setNotesSaveStatus(''), 2500);
  };

  const handleInsertTimestampToNotes = () => {
    const timestampStr = `[${new Date().toLocaleDateString('en-CA')} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] `;
    setQuickNoteText(prev => prev ? `${prev}\n${timestampStr}` : timestampStr);
  };

  const handleInsertTagToNotes = (tag: string) => {
    setQuickNoteText(prev => prev ? `${prev} ${tag} ` : `${tag} `);
  };

  // Signoff Form state
  const [signoffNotes, setSignoffNotes] = useState(inspection.signoffNotes || '');
  const [approvedBy, setApprovedBy] = useState(inspection.approvedBy || 'David Smith (Lead QA Engineer)');

  // NCR Form state
  const [ncrForm, setNcrForm] = useState({
    ncrNumber: inspection.ncrDetails?.ncrNumber || `NCR-2024-${Math.floor(100 + Math.random() * 900)}`,
    deficiencySummary: inspection.ncrDetails?.deficiencySummary || '',
    rootCause: inspection.ncrDetails?.rootCause || '',
    remediationPlan: inspection.ncrDetails?.remediationPlan || '',
    assignedEngineer: inspection.ncrDetails?.assignedEngineer || inspection.inspector,
    reinspectionDate: inspection.ncrDetails?.reinspectionDate || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0]
  });

  // Test metric state
  const [metricForm, setMetricForm] = useState({
    parameter: '',
    specification: '',
    measured: '',
    pass: true
  });

  const linkedActivity = activities.find(a => a.id === (editForm?.activityId || inspection?.activityId));
  const linkedProject = projects.find(p => p.id === inspection.projectId);

  // Compute attached documents from Document Hub
  const attachedDocuments = (documents || []).filter(d => 
    (inspection.linkedDocumentIds && inspection.linkedDocumentIds.includes(d.id)) ||
    d.linkedQAInspectionId === inspection.id ||
    (d.tags && d.tags.includes(inspection.id))
  );

  // Filtered documents within inspection
  const filteredAttachedDocuments = attachedDocuments.filter(doc => {
    const matchesSearch = !docSearchQuery.trim() || 
      doc.title.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(docSearchQuery.toLowerCase()) ||
      (doc.tags || []).some(t => t.toLowerCase().includes(docSearchQuery.toLowerCase())) ||
      (doc.description || '').toLowerCase().includes(docSearchQuery.toLowerCase());
    
    if (docTypeFilter === 'all') return matchesSearch;
    return matchesSearch && doc.fileType === docTypeFilter;
  });

  // Unlinked existing documents from Hub (for linking modal)
  const unlinkedHubDocuments = (documents || []).filter(doc => 
    !attachedDocuments.some(ad => ad.id === doc.id) &&
    (!existingDocSearch.trim() || 
      doc.title.toLowerCase().includes(existingDocSearch.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(existingDocSearch.toLowerCase()) ||
      doc.category.toLowerCase().includes(existingDocSearch.toLowerCase()))
  );

  const handleSaveEditInspection = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...inspection,
      title: editForm.title || inspection.title,
      category: editForm.category || inspection.category,
      location: editForm.location || inspection.location,
      inspector: editForm.inspector || inspection.inspector,
      date: editForm.date || inspection.date,
      inspectionTime: editForm.inspectionTime || inspection.inspectionTime,
      client: editForm.client !== undefined ? editForm.client : inspection.client,
      epc: editForm.epc !== undefined ? editForm.epc : inspection.epc,
      subcontractor: editForm.subcontractor !== undefined ? editForm.subcontractor : inspection.subcontractor,
      documentNumber: editForm.documentNumber !== undefined ? editForm.documentNumber : inspection.documentNumber,
      referenceDrawingNumber: editForm.referenceDrawingNumber !== undefined ? editForm.referenceDrawingNumber : inspection.referenceDrawingNumber,
      activityId: editForm?.activityId,
      clientQCRepresentative: editForm.clientQCRepresentative,
      clientQCStatus: editForm.clientQCStatus as any,
      clientQCNotes: editForm.clientQCNotes,
      clientQCSignoffDate: editForm.clientQCSignoffDate
    });
    setIsEditModalOpen(false);
  };

  const handleApproveInspection = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...inspection,
      status: 'Passed',
      signoffNotes,
      approvedBy,
      approvalDate: new Date().toISOString().split('T')[0]
    });
    setIsSignoffModalOpen(false);
  };

  const handleRaiseNCR = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...inspection,
      status: 'Failed',
      ncrCode: ncrForm.ncrNumber,
      ncrDetails: {
        ncrNumber: ncrForm.ncrNumber,
        deficiencySummary: ncrForm.deficiencySummary,
        rootCause: ncrForm.rootCause,
        remediationPlan: ncrForm.remediationPlan,
        assignedEngineer: ncrForm.assignedEngineer,
        reinspectionDate: ncrForm.reinspectionDate,
        status: 'Open'
      }
    });
    setIsNCRModalOpen(false);
  };

  const handleAddTestMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricForm.parameter) return;

    const newMetric = {
      id: `MTR-${Date.now()}`,
      parameter: metricForm.parameter,
      specification: metricForm.specification,
      measured: metricForm.measured,
      pass: metricForm.pass
    };

    onSave({
      ...inspection,
      testMetrics: [...(inspection.testMetrics || []), newMetric]
    });

    setIsAddMetricModalOpen(false);
    setMetricForm({ parameter: '', specification: '', measured: '', pass: true });
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSave({
            ...inspection,
            photos: [...(inspection.photos || []), reader.result]
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadDocumentSuccess = (newDoc: DocumentItem) => {
    addDocument(newDoc);
    const updatedIds = Array.from(new Set([...(inspection.linkedDocumentIds || []), newDoc.id]));
    onSave({
      ...inspection,
      linkedDocumentIds: updatedIds
    });
    setIsUploadDocModalOpen(false);
  };

  const handleLinkExistingDocument = (doc: DocumentItem) => {
    const updatedDoc: DocumentItem = {
      ...doc,
      linkedQAInspectionId: inspection.id,
      linkedQAInspectionTitle: inspection.title,
      tags: Array.from(new Set([...(doc.tags || []), 'QA-QC', inspection.id]))
    };
    updateDocument(updatedDoc);
    const updatedIds = Array.from(new Set([...(inspection.linkedDocumentIds || []), doc.id]));
    onSave({
      ...inspection,
      linkedDocumentIds: updatedIds
    });
    setIsLinkExistingDocModalOpen(false);
  };

  const handleUnlinkDocument = (docId: string) => {
    const targetDoc = (documents || []).find(d => d.id === docId);
    if (targetDoc && targetDoc.linkedQAInspectionId === inspection.id) {
      updateDocument({
        ...targetDoc,
        linkedQAInspectionId: undefined,
        linkedQAInspectionTitle: undefined,
        tags: (targetDoc.tags || []).filter(t => t !== inspection.id)
      });
    }
    const updatedIds = (inspection.linkedDocumentIds || []).filter(id => id !== docId);
    onSave({
      ...inspection,
      linkedDocumentIds: updatedIds
    });
  };

  const getDocTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      case 'cad':
        return <FileCode className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-[#0B5FFF]" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-6 overflow-y-auto">
      {/* Top Navigation & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-600">{inspection.id}</span>
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{inspection.category}</Badge>
              {inspection.ncrCode && <Badge variant="danger" className="text-[10px] font-mono">{inspection.ncrCode}</Badge>}
              <Badge variant={inspection.status === 'Passed' ? 'success' : inspection.status === 'Failed' ? 'danger' : 'warning'}>
                {inspection.status}
              </Badge>
              {attachedDocuments.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B5FFF] dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <FolderOpen className="h-3 w-3" /> {attachedDocuments.length} Attached {attachedDocuments.length === 1 ? 'Doc' : 'Docs'}
                </span>
              )}
              {comments.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-[#0B5FFF]" /> {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{inspection.title}</h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            title="Print quality inspection report using browser print"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print Inspection
          </button>

          {canEditQuality && (
            <Button
              onClick={() => setIsMeasurementModalOpen(true)}
              variant="outline"
              className="gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl text-xs font-semibold"
            >
              <Ruler className="h-4 w-4 text-emerald-600" /> Measurements & Quantities
            </Button>
          )}

          {canEditQuality && (
            <button
              onClick={() => {
                setUploadModalCategory('QA/QC Inspections');
                setIsUploadDocModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#0B5FFF] dark:text-blue-300 text-xs font-semibold transition-colors border border-blue-200 dark:border-blue-800"
            >
              <UploadCloud className="h-4 w-4" /> Upload Document
            </button>
          )}

          {canEditQuality && (
            <button
              onClick={() => {
                setEditForm({
                  title: inspection.title,
                  category: inspection.category,
                  location: inspection.location,
                  inspector: inspection.inspector,
                  date: inspection.date,
                  activityId: inspection?.activityId,
                  clientQCRepresentative: inspection.clientQCRepresentative || '',
                  clientQCStatus: inspection.clientQCStatus || 'Pending Client Review',
                  clientQCNotes: inspection.clientQCNotes || '',
                  clientQCSignoffDate: inspection.clientQCSignoffDate || new Date().toISOString().split('T')[0]
                });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Edit3 className="h-4 w-4 text-[#0B5FFF]" /> Edit Inspection
            </button>
          )}

          {inspection.status !== 'Passed' && canEditQuality && (
            <Button onClick={() => setIsSignoffModalOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Approve QA Signoff
            </Button>
          )}

          {inspection.status !== 'Failed' && canEditQuality && (
            <Button onClick={() => setIsNCRModalOpen(true)} variant="outline" className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" /> Issue Non-Conformance (NCR)
            </Button>
          )}

          {onDelete && canManage(userRole) && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this QA/QC inspection record?')) {
                  onDelete(inspection.id);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 py-2.5 overflow-x-auto w-full shrink-0 min-h-[52px] bg-slate-50/70 dark:bg-slate-900/60 rounded-xl px-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'overview' 
              ? 'bg-[#0B5FFF] text-white shadow-sm ring-2 ring-blue-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Overview & QA Specifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('measurements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'measurements' 
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <Ruler className="h-4 w-4 shrink-0" />
          <span>Measurements & Quantities</span>
          {(inspection.targetQuantity || inspection.inspectedQuantity) ? (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'measurements' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
            }`}>
              {inspection.approvedQuantity || 0}/{inspection.targetQuantity || inspection.inspectedQuantity || 0} {inspection.unit || 'm'}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ncr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'ncr' 
              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Non-Conformance (NCR) & Remediation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'tests' 
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <Award className="h-4 w-4 shrink-0" />
          <span>Lab Test Results & Certificates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'documents' 
              ? 'bg-[#0B5FFF] text-white shadow-sm ring-2 ring-blue-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span>QA Documents & Hub</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'documents' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#0B5FFF] dark:bg-blue-900/60 dark:text-blue-200'
          }`}>
            {attachedDocuments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'photos' 
              ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-500/20' 
              : 'text-slate-600 hover:bg-white dark:hover:bg-slate-800 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          <ImageIcon className="h-4 w-4 shrink-0" />
          <span>Photo Evidence Gallery</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & QA SPECIFICATIONS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Metadata Card */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0B5FFF]" /> Inspection Parameters & Site Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Inspector</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#0B5FFF]" /> {inspection.inspector}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Inspection Date & Time</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#0B5FFF]" /> {inspection.date} {inspection.inspectionTime ? `@ ${inspection.inspectionTime}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Site Location</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-red-500" /> {inspection.location}
                  </span>
                </div>
              </div>

              {/* Stakeholder & Engineering Reference Documents */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                    <span>Contractual Parties & Engineering Reference Documents</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Formal Quality Submissions</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">1. Client</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {inspection.client || linkedProject?.client || 'Not Specified'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">2. EPC Contractor</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {inspection.epc || 'Scedih Engineering (EPC)'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">3. Subcontractor</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {inspection.subcontractor || 'Specialist Civils Subcontractor'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">4. Document / ITR Number</span>
                    <strong className="font-mono text-[#0B5FFF] font-bold">
                      {inspection.documentNumber || 'QA-ITR-2026-042'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">5. Inspection Schedule</span>
                    <strong className="font-mono text-slate-700 dark:text-slate-300">
                      {inspection.date} {inspection.inspectionTime ? `@ ${inspection.inspectionTime}` : ''}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">6. Reference Drawing Number</span>
                    <strong className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {inspection.referenceDrawingNumber || 'DWG-MV-201-REV-04'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* QA Measurement Scope & Quantity Card */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 space-y-3.5">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <Ruler className="h-5 w-5 text-emerald-600" />
                    <span>Inspection Scope & Measured Quantities</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-700 bg-white dark:bg-slate-900">
                      {inspection.measurementType || 'Length'} ({inspection.unit || 'm'})
                    </Badge>
                  </div>
                  {canEditQuality && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsMeasurementModalOpen(true)}
                      className="h-7 text-xs font-bold gap-1 rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 hover:bg-emerald-100"
                    >
                      <Ruler className="h-3 w-3" /> Log / Edit Measurements
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Required Scope</span>
                    <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {inspection.targetQuantity || 0} <span className="text-xs font-normal text-slate-400">{inspection.unit || 'm'}</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Inspected</span>
                    <span className="text-base font-black font-mono text-[#0B5FFF]">
                      {inspection.inspectedQuantity || 0} <span className="text-xs font-normal text-blue-400">{inspection.unit || 'm'}</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Approved</span>
                    <span className="text-base font-black font-mono text-emerald-600">
                      {inspection.approvedQuantity || 0} <span className="text-xs font-normal text-emerald-400">{inspection.unit || 'm'}</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase block">Rejected</span>
                    <span className="text-base font-black font-mono text-rose-600">
                      {inspection.rejectedQuantity || 0} <span className="text-xs font-normal text-rose-400">{inspection.unit || 'm'}</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Clearance: <strong className="text-emerald-600 font-mono">
                        {inspection.inspectedQuantity ? Math.round(((inspection.approvedQuantity || 0) / inspection.inspectedQuantity) * 100) : 0}% Pass Rate
                      </strong>
                    </span>
                    {inspection.toleranceSpec && (
                      <span className="text-slate-500 font-mono">
                        Spec: {inspection.toleranceSpec}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${inspection.targetQuantity ? ((inspection.approvedQuantity || 0) / inspection.targetQuantity) * 100 : ((inspection.approvedQuantity || 0) / (inspection.inspectedQuantity || 1)) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${inspection.targetQuantity ? ((inspection.rejectedQuantity || 0) / inspection.targetQuantity) * 100 : ((inspection.rejectedQuantity || 0) / (inspection.inspectedQuantity || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Client QC Clearance Card */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <UserCheck className="h-5 w-5" /> Client QC Representative Clearance
                  </div>
                  <Badge variant={inspection.clientQCStatus === 'Approved' ? 'success' : inspection.clientQCStatus === 'Rejected' ? 'danger' : 'outline'}>
                    {inspection.clientQCStatus || 'Pending Client Review'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p><strong>Client Representative:</strong> {inspection.clientQCRepresentative || 'Client QC Representative Not Assigned'}</p>
                  {inspection.clientQCNotes && <p><strong>Client Notes:</strong> {inspection.clientQCNotes}</p>}
                </div>
              </div>

              {/* Linked Construction Activity */}
              {linkedActivity && (
                <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 block mb-0.5">Linked Construction Activity</span>
                    <span className="font-bold text-slate-900 dark:text-white text-base">{linkedActivity.name}</span>
                    <p className="text-xs text-slate-500 mt-1">Discipline: {linkedActivity.discipline} • Work Package: {linkedActivity.workPackage}</p>
                  </div>
                  <Badge variant="outline" className="bg-white dark:bg-slate-900">{linkedActivity.id}</Badge>
                </div>
              )}

              {/* QA Approval Clearance Stamp */}
              {inspection.status === 'Passed' && (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Official QA Clearance Sign-Off
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {inspection.signoffNotes || 'All inspection criteria and quality specifications verified and passed.'}
                  </p>
                  <div className="pt-2 text-[11px] text-slate-500 font-semibold flex justify-between">
                    <span>Approved by: {inspection.approvedBy || 'QA Lead'}</span>
                    <span>Date: {inspection.approvalDate || inspection.date}</span>
                  </div>
                </div>
              )}

              {/* Attached QA Documents Quick Card */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/60 dark:bg-slate-900/40">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <FolderOpen className="h-4 w-4 text-[#0B5FFF]" />
                    Attached Quality Documents ({attachedDocuments.length})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('documents')}
                    className="text-xs font-bold text-[#0B5FFF] hover:underline h-7 px-2"
                  >
                    View All & Upload →
                  </Button>
                </div>

                {attachedDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachedDocuments.slice(0, 4).map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-[#0B5FFF] cursor-pointer transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                            {getDocTypeIcon(doc.fileType)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#0B5FFF] transition-colors">
                              {doc.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <span>{doc.fileSizeFormatted || formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span className="text-emerald-600 font-semibold">{doc.status}</span>
                            </div>
                          </div>
                        </div>
                        <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#0B5FFF] shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 italic">
                    No documents attached yet. Click "Upload Document" to attach test certificates, NDT logs, or specs.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Side Column */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Project Association</h3>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-[#0B5FFF]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{linkedProject?.name || inspection.projectId}</h4>
                  <span className="text-xs text-slate-500">{linkedProject?.client || 'Project Client'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">QA Inspection Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Overall Clearance</span>
                  <Badge variant={inspection.status === 'Passed' ? 'success' : inspection.status === 'Failed' ? 'danger' : 'warning'}>
                    {inspection.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Client QC Clearance</span>
                  <Badge variant={inspection.clientQCStatus === 'Approved' ? 'success' : inspection.clientQCStatus === 'Rejected' ? 'danger' : 'outline'}>
                    {inspection.clientQCStatus || 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">Non-Conformance</span>
                  <span>{inspection.ncrCode ? 'NCR Active' : 'None'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Attached QA Documents</span>
                  <span className="font-bold text-[#0B5FFF]">{attachedDocuments.length}</span>
                </div>
              </div>
            </Card>

            {/* QA Comments & Inspector Notes Card */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
              {/* Header with Segmented Tabs */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100/80 dark:bg-blue-900/40 text-[#0B5FFF]">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Comments & Notes
                    </h3>
                  </div>
                </div>

                {/* Sub-tab pills */}
                <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveSideTab('comments')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      activeSideTab === 'comments'
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <span>Comments</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      activeSideTab === 'comments' 
                        ? 'bg-blue-100 dark:bg-blue-950 text-[#0B5FFF]' 
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {comments.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSideTab('notes')}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                      activeSideTab === 'notes'
                        ? 'bg-white dark:bg-slate-700 text-[#0B5FFF] dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <StickyNote className="h-3 w-3" />
                    <span>Field Notes</span>
                    {quickNoteText.trim().length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* COMMENTS TAB CONTENT */}
              {activeSideTab === 'comments' && (
                <div className="p-4 flex flex-col gap-4">
                  {/* Comments Thread List */}
                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {comments.length > 0 ? (
                      comments.map(comment => {
                        const currentUserName = currentUserProfile?.name || 'Current User';
                        const currentUserId = currentUserProfile?.id;
                        const isAuthor = Boolean(
                          (currentUserId && comment.userId && comment.userId === currentUserId) || 
                          (comment.author && comment.author.toLowerCase() === currentUserName.toLowerCase())
                        );
                        const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager' || 
                          currentUserProfile?.role === 'Admin' || currentUserProfile?.role === 'Manager';
                        const canDelete = isAuthor || isAdminOrManager;
                        const canEdit = isAuthor;
                        const isEditingThis = editingCommentId === comment.id;

                        const formattedDate = new Date(comment.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        });
                        const formattedTime = new Date(comment.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div key={comment.id} className="flex gap-2.5 group">
                            {comment.avatar ? (
                              <img 
                                src={comment.avatar} 
                                alt={comment.author} 
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 object-cover" 
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-[#0B5FFF] font-bold text-[10px] flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                {comment.userInitials || comment.author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl rounded-tl-none p-3 border border-slate-200/80 dark:border-slate-700/80 relative transition-all">
                              <div className="flex justify-between items-start mb-1 gap-1 flex-wrap">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {comment.author}
                                  </span>
                                  {comment.userRole && (
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-blue-100/70 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                                      {comment.userRole}
                                    </span>
                                  )}
                                  {isAuthor && (
                                    <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                      You
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {formattedDate} {formattedTime}
                                  </span>
                                  {comment.editedAt && (
                                    <span className="text-[8px] text-slate-400 italic">
                                      (edited)
                                    </span>
                                  )}
                                  {canEdit && !isEditingThis && (
                                    <button 
                                      type="button"
                                      onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#0B5FFF] text-slate-400 transition-all"
                                      title="Edit comment"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                  )}
                                  {canDelete && !isEditingThis && (
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 text-slate-400 transition-all"
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isEditingThis ? (
                                <div className="mt-2 space-y-2">
                                  <textarea 
                                    value={editingCommentText}
                                    onChange={e => setEditingCommentText(e.target.value)}
                                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 focus:ring-1 focus:ring-[#0B5FFF]"
                                    rows={2}
                                  />
                                  <div className="flex justify-end gap-1.5">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-6 text-[10px] px-2">Cancel</Button>
                                    <Button size="sm" onClick={() => handleSaveEditComment(comment.id)} className="h-6 text-[10px] px-2 bg-[#0B5FFF] text-white">Save</Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                  {comment.text}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 flex flex-col items-center gap-1.5">
                        <MessageCircle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                        <span>No comments yet.</span>
                        <span className="text-[10px] text-slate-400">Post an observation or discuss with the QA team below.</span>
                      </div>
                    )}
                  </div>

                  {/* Comment Input Box */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    {/* Quick Tag Pills */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-slate-400 mr-0.5">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setNewCommentText(prev => prev ? `${prev} @ClientQC ` : '@ClientQC ')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0B5FFF] border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                      >
                        + @ClientQC
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCommentText(prev => prev ? `${prev} [Hold Point] ` : '[Hold Point] ')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                      >
                        + [Hold Point]
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCommentText(prev => prev ? `${prev} [Passed Spec] ` : '[Passed Spec] ')}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                      >
                        + [Passed]
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handlePostComment();
                          }
                        }}
                        placeholder="Add QA remark or question... (Enter to send)"
                        className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] min-h-[64px]"
                      />
                      <Button
                        size="icon"
                        onClick={handlePostComment}
                        disabled={!newCommentText.trim()}
                        className="absolute right-2 bottom-3 h-7 w-7 rounded-lg bg-[#0B5FFF] hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Post comment"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* FIELD NOTES TAB CONTENT */}
              {activeSideTab === 'notes' && (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      Inspector field scratchpad & punch-list
                    </span>
                    {notesSaveStatus && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                        <Check className="h-3 w-3" /> {notesSaveStatus}
                      </span>
                    )}
                  </div>

                  {/* Notes Quick Tag Insertion */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={handleInsertTimestampToNotes}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1"
                    >
                      <Clock3 className="h-2.5 w-2.5" /> Timestamp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTagToNotes('[Punch List]')}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800"
                    >
                      + [Punch List]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTagToNotes('[Re-inspect Req]')}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800"
                    >
                      + [Re-inspect]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTagToNotes('[NDT Verified]')}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                    >
                      + [NDT Verified]
                    </button>
                  </div>

                  <textarea
                    value={quickNoteText}
                    onChange={e => setQuickNoteText(e.target.value)}
                    placeholder="Type inspector observations, dimensions measured on site, punch items, or re-inspection requirements..."
                    rows={8}
                    className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0B5FFF] leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {quickNoteText.length} characters
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      className="h-7 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Notes
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 1.5: MEASUREMENTS & QA QUANTITY CLEARANCE */}
      {activeTab === 'measurements' && (
        <div className="flex flex-col gap-6 w-full">
          {/* Header Bar */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ruler className="h-5 w-5 text-emerald-600" /> Quality Measurement Scope & Verification
              </h2>
              <p className="text-xs text-slate-500">
                Track physical quantities, linear spans, weights, and tolerances inspected and approved on site.
              </p>
            </div>

            {canEditQuality && (
              <Button
                onClick={() => setIsMeasurementModalOpen(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Sliders className="h-4 w-4" /> Log / Edit Measurements
              </Button>
            )}
          </div>

          {/* Primary KPI Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <Card className="p-4 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Target Scope
              </span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {inspection.targetQuantity || 0} <span className="text-xs font-normal text-slate-400">{inspection.unit || 'm'}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Engineering Requirement</span>
            </Card>

            <Card className="p-4 border-blue-200 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                Inspected
              </span>
              <div className="text-2xl font-black font-mono text-[#0B5FFF]">
                {inspection.inspectedQuantity || 0} <span className="text-xs font-normal text-blue-400">{inspection.unit || 'm'}</span>
              </div>
              <span className="text-[10px] text-blue-500 mt-1 block">
                {inspection.targetQuantity ? `${Math.round(((inspection.inspectedQuantity || 0) / inspection.targetQuantity) * 100)}% of target` : 'Logged on site'}
              </span>
            </Card>

            <Card className="p-4 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Approved / Passed
              </span>
              <div className="text-2xl font-black font-mono text-emerald-600">
                {inspection.approvedQuantity || 0} <span className="text-xs font-normal text-emerald-400">{inspection.unit || 'm'}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                {inspection.inspectedQuantity ? `${Math.round(((inspection.approvedQuantity || 0) / inspection.inspectedQuantity) * 100)}% Pass Rate` : 'No defects'}
              </span>
            </Card>

            <Card className="p-4 border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                Rejected / Defective
              </span>
              <div className="text-2xl font-black font-mono text-rose-600">
                {inspection.rejectedQuantity || 0} <span className="text-xs font-normal text-rose-400">{inspection.unit || 'm'}</span>
              </div>
              <span className="text-[10px] text-rose-500 mt-1 block">
                {(inspection.rejectedQuantity || 0) > 0 ? 'Requires NCR / Remediation' : 'Zero defects'}
              </span>
            </Card>

            <Card className="p-4 border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Remaining to Inspect
              </span>
              <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
                {Math.max((inspection.targetQuantity || 0) - (inspection.inspectedQuantity || 0), 0)} <span className="text-xs font-normal text-slate-400">{inspection.unit || 'm'}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Uninspected Balance</span>
            </Card>
          </div>

          {/* Visual Multi-Segment Gauge */}
          <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Approved: {inspection.approvedQuantity || 0} {inspection.unit || 'm'}</span>
                {Boolean(inspection.rejectedQuantity) && (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ml-2" />
                    <span className="text-rose-600">Rejected: {inspection.rejectedQuantity} {inspection.unit || 'm'}</span>
                  </>
                )}
              </span>

              {inspection.toleranceSpec && (
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Spec: {inspection.toleranceSpec}
                </span>
              )}
            </div>

            <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${inspection.targetQuantity ? ((inspection.approvedQuantity || 0) / inspection.targetQuantity) * 100 : ((inspection.approvedQuantity || 0) / (inspection.inspectedQuantity || 1)) * 100}%` }}
                title={`Approved: ${inspection.approvedQuantity || 0} ${inspection.unit || 'm'}`}
              />
              <div 
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${inspection.targetQuantity ? ((inspection.rejectedQuantity || 0) / inspection.targetQuantity) * 100 : ((inspection.rejectedQuantity || 0) / (inspection.inspectedQuantity || 1)) * 100}%` }}
                title={`Rejected: ${inspection.rejectedQuantity || 0} ${inspection.unit || 'm'}`}
              />
            </div>
          </Card>

          {/* Itemized Test Points & Sub-Measurements Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600" />
                  Itemized Measurement Records & Inspection Test Points ({inspection.measurementItems?.length || 0})
                </h3>
                <p className="text-xs text-slate-400">
                  Granular measurements per trench run, layer lift, test cube, or structural segment.
                </p>
              </div>

              {canEditQuality && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsMeasurementModalOpen(true)}
                  className="gap-1 text-xs font-bold rounded-xl border-emerald-300 text-emerald-700 dark:text-emerald-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Sub-Measurement
                </Button>
              )}
            </div>

            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Test Point / Description</th>
                      <th className="p-3.5">Target</th>
                      <th className="p-3.5">Inspected</th>
                      <th className="p-3.5">Approved</th>
                      <th className="p-3.5">Rejected</th>
                      <th className="p-3.5">Tolerance</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Clearance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {inspection.measurementItems && inspection.measurementItems.length > 0 ? (
                      inspection.measurementItems.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {rec.itemDescription || 'General Test Point'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                            {rec.targetOrRequired} {rec.unit || inspection.unit || 'm'}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-[#0B5FFF]">
                            {rec.inspectedAmount} {rec.unit || inspection.unit || 'm'}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-600">
                            {rec.approvedAmount} {rec.unit || inspection.unit || 'm'}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-rose-600">
                            {rec.rejectedAmount || 0} {rec.unit || inspection.unit || 'm'}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono">
                            {rec.tolerance || inspection.toleranceSpec || '—'}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {rec.inspectionDate || inspection.date}
                          </td>
                          <td className="p-3.5 text-right">
                            <Badge 
                              variant={
                                rec.status === 'Approved' ? 'success' : 
                                rec.status === 'Rejected' ? 'danger' : 
                                rec.status === 'Partially Approved' ? 'warning' : 'outline'
                              }
                              className="text-[10px]"
                            >
                              {rec.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                          No sub-measurements added yet. Overall inspection scope is tracked above ({inspection.targetQuantity || 0} {inspection.unit || 'm'}).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: NON-CONFORMANCE REPORT (NCR) & REMEDIATION */}
      {activeTab === 'ncr' && (
        <div className="flex flex-col gap-6 w-full">
          {inspection.ncrDetails ? (
            <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
              <CardHeader className="pb-3 border-b border-rose-100 dark:border-rose-900/20">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-rose-600">{inspection.ncrDetails.ncrNumber}</span>
                    <CardTitle className="text-xl font-bold text-rose-700 dark:text-rose-400">Non-Conformance Report Details</CardTitle>
                  </div>
                  <Badge variant="danger">{inspection.ncrDetails.status}</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Deficiency Summary</h4>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{inspection.ncrDetails.deficiencySummary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-1">Root Cause Analysis</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{inspection.ncrDetails.rootCause || 'Root cause investigation pending.'}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold text-slate-400 uppercase mb-1">Corrective Remediation Plan</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{inspection.ncrDetails.remediationPlan || 'Remediation plan to be submitted by contractor.'}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                  <span>Assigned QA Engineer: {inspection.ncrDetails.assignedEngineer}</span>
                  <span>Target Re-inspection: {inspection.ncrDetails.reinspectionDate}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No Open Non-Conformance Report (NCR)</h3>
              <p className="text-xs text-slate-500 mt-1">This inspection has zero reported quality non-conformances.</p>
              {canManage(userRole) && (
                <Button onClick={() => setIsNCRModalOpen(true)} className="mt-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs gap-2">
                  <AlertTriangle className="h-4 w-4" /> Issue Non-Conformance Ticket
                </Button>
              )}
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: LAB TEST RESULTS & CERTIFICATES */}
      {activeTab === 'tests' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#0B5FFF] dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" /> Laboratory & NDT Test Parameters
              </h2>
              <p className="text-xs text-slate-500">Quantitative test measurements (e.g., Concrete Slump, Ultrasonic NDT, Pressure tests).</p>
            </div>
            <div className="flex items-center gap-2">
              {canEditQuality && (
                <Button 
                  onClick={() => {
                    setUploadModalCategory('QA/QC Inspections');
                    setIsUploadDocModalOpen(true);
                  }}
                  variant="outline"
                  className="gap-2 border-emerald-300 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs"
                >
                  <UploadCloud className="h-4 w-4" /> Upload Lab Certificate
                </Button>
              )}
              {canManage(userRole) && (
                <Button onClick={() => setIsAddMetricModalOpen(true)} className="gap-2 bg-emerald-600 text-white rounded-xl text-xs">
                  <Plus className="h-4 w-4" /> Add Test Metric
                </Button>
              )}
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Test Parameter</th>
                  <th className="p-4">Specification Limit</th>
                  <th className="p-4">Measured Result</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {inspection.testMetrics && inspection.testMetrics.length > 0 ? (
                  inspection.testMetrics.map(mtr => (
                    <tr key={mtr.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4 font-bold">{mtr.parameter}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{mtr.specification}</td>
                      <td className="p-4 font-mono font-semibold">{mtr.measured}</td>
                      <td className="p-4 text-right">
                        <Badge variant={mtr.pass ? 'success' : 'danger'}>
                          {mtr.pass ? 'PASSED ✓' : 'FAILED ✗'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">No laboratory test metrics logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* Laboratory Test Documents Section */}
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                Attached Lab Certificates & Third-Party Reports ({attachedDocuments.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('documents')}
                className="text-xs font-bold text-[#0B5FFF] hover:underline"
              >
                Manage All Documents →
              </Button>
            </div>

            {attachedDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {attachedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 shrink-0">
                        {getDocTypeIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{doc.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-slate-500">{doc.fileSizeFormatted || formatFileSize(doc.fileSize)}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold">{doc.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-7 px-2 text-xs font-semibold text-[#0B5FFF]"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadDocument(doc)}
                        className="h-7 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-400 italic mb-2">No laboratory certificates or test sheets attached yet.</p>
                {canEditQuality && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setUploadModalCategory('QA/QC Inspections');
                      setIsUploadDocModalOpen(true);
                    }}
                    className="text-xs h-8 rounded-xl gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload Test Certificate Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: QA DOCUMENTS & DOCUMENT ENGINE HUB */}
      {activeTab === 'documents' && (
        <div className="flex flex-col gap-6 w-full">
          {/* Header & Quick Action Banner */}
          <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/10 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-slate-950/30 p-5 sm:p-6 rounded-2xl border border-blue-200/80 dark:border-blue-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="h-5 w-5 text-[#0B5FFF]" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">QA Quality Documents & Engineering Hub</h2>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs font-bold">
                  {attachedDocuments.length} Attached
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                Integrated with the centralized Document Engine. Attach lab test certificates, mill test reports (MTC), NDT reports, non-conformance records, and method statements.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => navigate(`/documents?category=QA/QC%20Inspections`)}
                variant="outline"
                className="gap-1.5 rounded-xl text-xs font-semibold border-slate-300 dark:border-slate-700"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" /> Open Document Hub
              </Button>

              {canEditQuality && (
                <Button
                  onClick={() => setIsLinkExistingDocModalOpen(true)}
                  variant="outline"
                  className="gap-1.5 rounded-xl text-xs font-semibold border-[#0B5FFF]/40 text-[#0B5FFF] hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <LinkIcon className="h-4 w-4" /> Link from Hub
                </Button>
              )}

              {canEditQuality && (
                <Button
                  onClick={() => {
                    setUploadModalCategory('QA/QC Inspections');
                    setIsUploadDocModalOpen(true);
                  }}
                  className="gap-1.5 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  <UploadCloud className="h-4 w-4" /> Upload QA Document
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search attached documents, tags, or specs..."
                value={docSearchQuery}
                onChange={e => setDocSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
              />
            </div>

            {/* File Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'pdf', label: 'PDFs' },
                { id: 'excel', label: 'Excel / CSV' },
                { id: 'image', label: 'Images / NDT' },
                { id: 'cad', label: 'CAD / DWG' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setDocTypeFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    docTypeFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Document Cards Grid */}
          {filteredAttachedDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAttachedDocuments.map(doc => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 hover:border-[#0B5FFF] dark:hover:border-[#0B5FFF] hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Type, Revision, Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                          {getDocTypeIcon(doc.fileType)}
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {doc.fileExtension || doc.fileType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#0B5FFF]">
                          {doc.version || 'v1.0'}
                        </span>
                        <Badge variant={doc.status === 'Approved' ? 'success' : doc.status === 'Under Review' ? 'warning' : 'outline'} className="text-[10px]">
                          {doc.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Title & Filename */}
                    <div>
                      <h3
                        onClick={() => setPreviewDoc(doc)}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-[#0B5FFF] dark:hover:text-[#0B5FFF] cursor-pointer transition-colors line-clamp-2"
                      >
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{doc.fileName}</p>
                    </div>

                    {/* Description if available */}
                    {doc.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                        {doc.description}
                      </p>
                    )}

                    {/* Tags */}
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{doc.fileSizeFormatted || formatFileSize(doc.fileSize)}</span>
                      <span className="text-[10px] text-slate-400">By {doc.uploadedBy}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        title="Preview with In-Browser Viewer Engine"
                        className="p-1.5 rounded-lg bg-blue-50 text-[#0B5FFF] hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => downloadDocument(doc)}
                        title="Download Document Binary"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => navigate(`/documents?id=${doc.id}`)}
                        title="Open in Document Hub"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>

                      {canEditQuality && (
                        <button
                          onClick={() => {
                            if (confirm(`Unlink "${doc.title}" from this inspection record?`)) {
                              handleUnlinkDocument(doc.id);
                            }
                          }}
                          title="Unlink from this inspection"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 transition-colors"
                        >
                          <Unlink className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <FolderOpen className="h-12 w-12 text-[#0B5FFF] mx-auto mb-3 opacity-60" />
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Attached Quality Documents</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload laboratory test results, material certificates, inspection sign-off sheets, or NDT logs directly to link with this QA/QC inspection.
              </p>
              {canEditQuality && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Button
                    onClick={() => {
                      setUploadModalCategory('QA/QC Inspections');
                      setIsUploadDocModalOpen(true);
                    }}
                    className="gap-2 bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold"
                  >
                    <UploadCloud className="h-4 w-4" /> Upload QA Document
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsLinkExistingDocModalOpen(true)}
                    className="gap-2 rounded-xl text-xs font-semibold border-slate-300 dark:border-slate-700"
                  >
                    <LinkIcon className="h-4 w-4" /> Link from Document Hub
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: PHOTO EVIDENCE GALLERY & LIGHTBOX */}
      {activeTab === 'photos' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" /> Site Inspection Photo Evidence
              </h2>
              <p className="text-xs text-slate-500">Inspection photos and defect markups.</p>
            </div>
            {canManage(userRole) && (
              <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="h-4 w-4" /> Upload Evidence Photo
                <input type="file" accept="image/*" onChange={handleAddPhoto} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {inspection.photos && inspection.photos.length > 0 ? (
              inspection.photos.map((photo, idx) => (
                <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 aspect-square cursor-pointer" onClick={() => setLightboxImage(photo)}>
                  <img src={photo} alt={`Inspection Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                    <ImageIcon className="h-4 w-4" /> View Zoom
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                No site evidence photos uploaded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR PHOTOS */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={lightboxImage} alt="Zoomed Evidence" className="max-h-[85vh] w-auto object-contain rounded-xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* EDIT INSPECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit QA/QC Inspection
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSaveEditInspection} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspection Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Site Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspector (QC/QA) *</label>
                  <CustomSelect
                    value={editForm.inspector || ''}
                    onChange={val => setEditForm({ ...editForm, inspector: val })}
                    options={employeeInspectorOptions}
                    placeholder="Select QC/QA Inspector..."
                    customPlaceholder="Enter custom inspector name..."
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Number</label>
                  <input
                    type="text"
                    placeholder="e.g. QA-ITR-2026-089"
                    value={editForm.documentNumber}
                    onChange={e => setEditForm({ ...editForm, documentNumber: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              {/* Stakeholders: Client, EPC, Subcontractor */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">1. Client</label>
                  <input
                    type="text"
                    placeholder="Client Name"
                    value={editForm.client}
                    onChange={e => setEditForm({ ...editForm, client: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">2. EPC Contractor</label>
                  <input
                    type="text"
                    placeholder="EPC Contractor"
                    value={editForm.epc}
                    onChange={e => setEditForm({ ...editForm, epc: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">3. Subcontractor</label>
                  <input
                    type="text"
                    placeholder="Subcontractor"
                    value={editForm.subcontractor}
                    onChange={e => setEditForm({ ...editForm, subcontractor: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              {/* Date & Time + Drawing Reference */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspection Date & Time</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full h-10 px-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono"
                    />
                    <input
                      type="time"
                      value={editForm.inspectionTime}
                      onChange={e => setEditForm({ ...editForm, inspectionTime: e.target.value })}
                      className="w-full h-10 px-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reference Drawing Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DWG-MV-201-REV-04"
                    value={editForm.referenceDrawingNumber}
                    onChange={e => setEditForm({ ...editForm, referenceDrawingNumber: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Client QC Status</label>
                  <select
                    value={editForm.clientQCStatus}
                    onChange={e => setEditForm({ ...editForm, clientQCStatus: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  >
                    <option value="Pending Client Review">Pending Client Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Linked Construction Activity</label>
                  <select
                    value={editForm?.activityId}
                    onChange={e => setEditForm({ ...editForm, activityId: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  >
                    {activities.map(a => (
                      <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Changes</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* APPROVE QA SIGNOFF MODAL */}
      {isSignoffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Digital QA Clearance Sign-Off
              </h3>
              <button onClick={() => setIsSignoffModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleApproveInspection} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approving QA Engineer *</label>
                <CustomSelect
                  value={approvedBy}
                  onChange={val => setApprovedBy(val)}
                  options={employeeInspectorOptions}
                  placeholder="Select Approving QA Engineer..."
                  customPlaceholder="Enter custom engineer name..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Clearance Notes & Verification Summary</label>
                <textarea rows={3} placeholder="All specifications passed according to structural drawings..." value={signoffNotes} onChange={e => setSignoffNotes(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsSignoffModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white">Confirm Sign-Off</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ISSUE NCR MODAL */}
      {isNCRModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-5 w-5" /> Issue Non-Conformance Report (NCR)
              </h3>
              <button onClick={() => setIsNCRModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleRaiseNCR} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">NCR Number</label>
                  <input type="text" value={ncrForm.ncrNumber} onChange={e => setNcrForm({ ...ncrForm, ncrNumber: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Re-inspection Target</label>
                  <input type="date" value={ncrForm.reinspectionDate} onChange={e => setNcrForm({ ...ncrForm, reinspectionDate: e.target.value })} className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Deficiency Description *</label>
                <textarea rows={3} required placeholder="Detail the defect or non-conforming result observed..." value={ncrForm.deficiencySummary} onChange={e => setNcrForm({ ...ncrForm, deficiencySummary: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Corrective Remediation Plan</label>
                <textarea rows={2} placeholder="Remediation steps required prior to re-inspection..." value={ncrForm.remediationPlan} onChange={e => setNcrForm({ ...ncrForm, remediationPlan: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsNCRModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 text-white">Issue NCR Ticket</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ADD TEST METRIC MODAL */}
      {isAddMetricModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" /> Add Quantitative Test Metric
              </h3>
              <button onClick={() => setIsAddMetricModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddTestMetric} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Parameter *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concrete Slump Test (mm)"
                  value={metricForm.parameter}
                  onChange={e => setMetricForm({ ...metricForm, parameter: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Specification Limit</label>
                <input
                  type="text"
                  placeholder="e.g. 75mm ± 25mm"
                  value={metricForm.specification}
                  onChange={e => setMetricForm({ ...metricForm, specification: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Measured Site Result</label>
                <input
                  type="text"
                  placeholder="e.g. 85mm"
                  value={metricForm.measured}
                  onChange={e => setMetricForm({ ...metricForm, measured: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Outcome</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="passStatus"
                      checked={metricForm.pass === true}
                      onChange={() => setMetricForm({ ...metricForm, pass: true })}
                      className="text-emerald-600"
                    />
                    <span className="text-emerald-600 font-bold">Passed</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="passStatus"
                      checked={metricForm.pass === false}
                      onChange={() => setMetricForm({ ...metricForm, pass: false })}
                      className="text-rose-600"
                    />
                    <span className="text-rose-600 font-bold">Failed</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddMetricModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white">Save Metric</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* DOCUMENT UPLOAD MODAL (INTEGRATED WITH DOCUMENT ENGINE) */}
      <DocumentUploadModal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        onUpload={handleUploadDocumentSuccess}
        activities={activities}
        currentUser={currentUserProfile?.name || 'David Smith (QA Engineer)'}
        projectId={inspection.projectId}
        defaultActivityId={inspection.activityId}
        defaultCategory={uploadModalCategory}
        defaultQAInspectionId={inspection.id}
        defaultQAInspectionTitle={inspection.title}
      />

      {/* DOCUMENT PREVIEW MODAL (WITH FULL IN-BROWSER VIEWERS) */}
      <DocumentPreviewModal
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        activities={activities}
      />

      {/* LINK EXISTING DOCUMENT FROM HUB MODAL */}
      {isLinkExistingDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B5FFF]">
                  <LinkIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Link Existing Document from Hub</h3>
                  <p className="text-xs text-slate-500">Attach any existing blueprint, lab report, or specification to inspection {inspection.id}.</p>
                </div>
              </div>
              <button onClick={() => setIsLinkExistingDocModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Document Hub by title, category, or filename..."
                  value={existingDocSearch}
                  onChange={e => setExistingDocSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {unlinkedHubDocuments.length > 0 ? (
                unlinkedHubDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0B5FFF] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0">
                        {getDocTypeIcon(doc.fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{doc.category}</span>
                          <span>•</span>
                          <span>{doc.fileSizeFormatted || formatFileSize(doc.fileSize)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleLinkExistingDocument(doc)}
                      className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs h-8 px-3 rounded-xl shrink-0 gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" /> Attach
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  {existingDocSearch ? 'No matching documents found in the Hub.' : 'All documents in the Hub are already attached, or no documents exist yet.'}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" onClick={() => setIsLinkExistingDocModalOpen(false)} className="rounded-xl text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* QA Measurement & Scope Logging Modal */}
      {isMeasurementModalOpen && (
        <QAMeasurementModal
          inspection={inspection}
          isOpen={isMeasurementModalOpen}
          onClose={() => setIsMeasurementModalOpen(false)}
          onSave={(updated) => {
            onSave(updated);
            setIsMeasurementModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
