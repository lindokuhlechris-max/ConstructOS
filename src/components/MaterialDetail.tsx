import React, { useState, useRef } from 'react';
import { MaterialInventory, MaterialCertificate, MaterialDocument, MaterialReceipt, MaterialUsage } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from './ui';
import { useAppContext } from '../context/AppContext';
import { CameraCapture } from './CameraCapture';
import {
  Package,
  ArrowLeft,
  FileText,
  Upload,
  Download,
  Trash2,
  Edit3,
  Camera,
  Eye,
  X,
  Plus,
  ShieldCheck,
  FileCheck,
  BookOpen,
  Image as ImageIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  MapPin,
  DollarSign,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ClipboardList,
  UserCheck,
  Paperclip,
  Copy
} from 'lucide-react';

interface MaterialDetailProps {
  material: MaterialInventory;
  onSave?: (updated: MaterialInventory) => void;
  onClose?: () => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (material: MaterialInventory) => void;
}

export function MaterialDetail({ material: initialMaterial, onSave, onClose, onDelete, onDuplicate }: MaterialDetailProps) {
  const { 
    materials, currency, 
    materialReceipts, 
    materialUsages, 
    activities, 
    projects,
    updateMaterial, 
    deleteMaterial, 
    addMaterialReceipt, 
    addMaterialUsage, 
    addAuditLog, 
    userRole, 
    employees, 
    currentUserProfile
  } = useAppContext();

  const [material, setMaterial] = useState<MaterialInventory>(initialMaterial);
  const [isEditing, setIsEditing] = useState(false);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  
  const handleAssignTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId) return;
    
    const newAssignment = {
      id: crypto.randomUUID(),
      employeeId: assignEmployeeId,
      assignedDate: new Date().toISOString(),
      notes: assignNotes,
      assignedBy: currentUserProfile?.name || 'Admin'
    };
    
    updateMaterial({
      ...material,
      assignments: [...(material.assignments || []), newAssignment]
    });
    
    setMaterial(prev => ({
      ...prev,
      assignments: [...(prev.assignments || []), newAssignment]
    }));
    
    setIsAssignModalOpen(false);
    setAssignEmployeeId('');
    setAssignNotes('');
    
    addAuditLog({
      id: `AUD-${Date.now()}`,
      projectId: material.projectId || projects[0]?.id || 'PRJ-001',
      userId: currentUserProfile?.id || 'admin',
      userRole: currentUserProfile?.role || 'Admin',
      action: 'Tool Assigned',
      details: `Tool assigned to ${employees.find(e => e.id === assignEmployeeId)?.firstName}`,
      timestamp: new Date().toISOString(),
      entityType: 'Material',
      entityId: material.id
    });
  };

  const handleReturnTool = (assignmentId: string) => {
    const updatedAssignments = (material.assignments || []).map(a => 
      a.id === assignmentId ? { ...a, returnedDate: new Date().toISOString() } : a
    );
    
    updateMaterial({
      ...material,
      assignments: updatedAssignments
    });
    
    setMaterial(prev => ({
      ...prev,
      assignments: updatedAssignments
    }));
    
    addAuditLog({
      id: `AUD-${Date.now()}`,
      projectId: material.projectId || projects[0]?.id || 'PRJ-001',
      userId: currentUserProfile?.id || 'admin',
      userRole: currentUserProfile?.role || 'Admin',
      action: 'Tool Returned',
      details: 'Tool marked as returned',
      timestamp: new Date().toISOString(),
      entityType: 'Material',
      entityId: material.id
    });
  };

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(amount);
  };

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Modals for Certificates & Manuals
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

  // Certificate Form State
  const [certTitle, setCertTitle] = useState('');
  const [certType, setCertType] = useState<MaterialCertificate['type']>('Mill Test Certificate');

  // Manual / Doc Form State
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<MaterialDocument['type']>('Technical Specs');

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: material.name,
    category: material.category,
    sku: material.sku || '',
    unit: material.unit,
    estimatedQuantity: material.estimatedQuantity,
    receivedQuantity: material.receivedQuantity,
    usedQuantity: material.usedQuantity,
    unitCost: material.unitCost || 0,
    location: material.location || '',
    reorderLevel: material.reorderLevel || 0,
    notes: material.notes || '',
  });

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Calculations
  const balance = material.receivedQuantity - material.usedQuantity;
  const percentUsed = (material.usedQuantity / (material.estimatedQuantity || 1)) * 100;
  const threshold = material.reorderLevel !== undefined && material.reorderLevel >= 0 
    ? material.reorderLevel 
    : Math.round((material.estimatedQuantity || 100) * 0.1);
  const isBelowThreshold = balance <= threshold;
  
  let statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (balance <= 0) statusColor = 'bg-red-600 text-white font-bold';
  else if (isBelowThreshold) statusColor = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 font-extrabold';
  else if (material.usedQuantity > material.estimatedQuantity) statusColor = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';

  // Filter receipt & usage transactions for this material
  const myReceipts = materialReceipts.filter(r => r.materialId === material.id);
  const myUsages = materialUsages.filter(u => u.materialId === material.id);

  // Filter linked construction tasks
  const linkedTasks = activities.filter(act => 
    act.assignedMaterials?.some(m => m.materialId === material.id || m.name.toLowerCase() === material.name.toLowerCase())
  );

  const handlePersistMaterial = (updated: MaterialInventory) => {
    setMaterial(updated);
    if (onSave) onSave(updated);
    else updateMaterial(updated);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MaterialInventory = {
      ...material,
      name: editForm.name.trim(),
      category: editForm.category,
      sku: editForm.sku.trim() || undefined,
      unit: editForm.unit,
      estimatedQuantity: Number(editForm.estimatedQuantity),
      receivedQuantity: Number(editForm.receivedQuantity),
      usedQuantity: Number(editForm.usedQuantity),
      unitCost: Number(editForm.unitCost),
      location: editForm.location.trim() || undefined,
      reorderLevel: Number(editForm.reorderLevel),
      notes: editForm.notes.trim() || undefined,
    };
    handlePersistMaterial(updated);
    setIsEditing(false);
  };

  // Upload Certificate
  const handleUploadCertificate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !certTitle.trim()) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newCert: MaterialCertificate = {
        id: `CERT-${Date.now()}`,
        title: certTitle.trim(),
        fileUrl: dataUrl,
        uploadDate: new Date().toISOString().split('T')[0],
        type: certType,
        fileType: file.name.split('.').pop() || 'pdf',
      };

      const updatedCerts = [newCert, ...(material.certificates || [])];
      const updated = { ...material, certificates: updatedCerts };
      handlePersistMaterial(updated);

      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: material.projectId,
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Certificate Uploaded',
        details: `Uploaded certificate "${certTitle}" for material "${material.name}" (${material.id})`,
        timestamp: new Date().toISOString()
      });

      setIsCertModalOpen(false);
      setCertTitle('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCertificate = (certId: string) => {
    const updatedCerts = (material.certificates || []).filter(c => c.id !== certId);
    const updated = { ...material, certificates: updatedCerts };
    handlePersistMaterial(updated);
  };

  // Upload Manual / Document
  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docTitle.trim()) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newDoc: MaterialDocument = {
        id: `DOC-${Date.now()}`,
        title: docTitle.trim(),
        fileUrl: dataUrl,
        uploadDate: new Date().toISOString().split('T')[0],
        type: docType,
        fileType: file.name.split('.').pop() || 'pdf',
      };

      const updatedDocs = [newDoc, ...(material.manuals || [])];
      const updated = { ...material, manuals: updatedDocs };
      handlePersistMaterial(updated);

      addAuditLog({
        id: `AL-${Math.random().toString(36).substr(2, 9)}`,
        projectId: material.projectId,
        userId: userRole === 'Manager' ? 'Current User' : 'Current User',
        action: 'Manual Uploaded',
        details: `Uploaded document/manual "${docTitle}" for material "${material.name}" (${material.id})`,
        timestamp: new Date().toISOString()
      });

      setIsDocModalOpen(false);
      setDocTitle('');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = (material.manuals || []).filter(d => d.id !== docId);
    const updated = { ...material, manuals: updatedDocs };
    handlePersistMaterial(updated);
  };

  // Upload Photo
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedPhotos = [dataUrl, ...(material.photos || [])];
      const updated = { ...material, photos: updatedPhotos };
      handlePersistMaterial(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleCapturePhoto = (dataUrl: string) => {
    const updatedPhotos = [dataUrl, ...(material.photos || [])];
    const updated = { ...material, photos: updatedPhotos };
    handlePersistMaterial(updated);
    setIsCapturing(false);
  };

  const handleDeletePhoto = (photoIdx: number) => {
    const updatedPhotos = [...(material.photos || [])];
    updatedPhotos.splice(photoIdx, 1);
    const updated = { ...material, photos: updatedPhotos };
    handlePersistMaterial(updated);
  };

  // Receive & Use Form Handlers
  const handleReceiveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const quantity = Number(form.get('quantity'));
    if (quantity > 0) {
      addMaterialReceipt({
        id: `REC-${Math.random().toString(36).substr(2, 9)}`,
        materialId: material.id,
        date: new Date().toISOString(),
        quantity,
        receivedBy: userRole === 'Manager' ? 'Current User' : 'Current User',
        notes: form.get('notes') as string,
        supplier: form.get('supplier') as string,
        deliveryNoteNumber: form.get('deliveryNote') as string,
      });
      setMaterial(prev => ({ ...prev, receivedQuantity: prev.receivedQuantity + quantity }));
      setIsReceiptModalOpen(false);
    }
  };

  const handleUseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const quantity = Number(form.get('quantity'));
    const projectId = form.get('projectId') as string;
    
    if (quantity > 0) {
      addMaterialUsage({
        id: `USE-${Math.random().toString(36).substr(2, 9)}`,
        materialId: material.id,
        date: new Date().toISOString(),
        quantity,
        recordedBy: currentUserProfile?.name || 'Current User',
        notes: form.get('notes') as string,
      });
      setMaterial(prev => ({ ...prev, usedQuantity: prev.usedQuantity + quantity }));
      setIsUsageModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 sm:p-6 md:p-8 pb-24">
      {/* Header Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold tracking-widest text-[#0B5FFF] uppercase">
                {material.id}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase">{material.category}</Badge>
              {material.sku && (
                <Badge variant="outline" className="text-[10px] font-mono bg-slate-50 dark:bg-slate-800">
                  SKU: {material.sku}
                </Badge>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                {material.status}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
              {material.name}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={() => setIsReceiptModalOpen(true)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl text-xs font-medium px-3.5 h-10"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>Receive Stock</span>
          </Button>

          <Button 
            onClick={() => setIsUsageModalOpen(true)} 
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 rounded-xl text-xs font-medium px-3.5 h-10"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            <span>Record Usage</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)} 
            className="gap-1.5 rounded-xl text-xs font-medium px-3.5 h-10"
          >
            <Edit3 className="h-4 w-4" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
          </Button>

          {onDuplicate && (
            <Button 
              variant="outline" 
              onClick={() => onDuplicate(material)} 
              className="gap-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-medium px-3.5 h-10"
              title="Duplicate material with specs & edit minor differences"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate</span>
            </Button>
          )}

          {onDelete && (
            <Button 
              variant="outline" 
              onClick={() => onDelete(material.id)} 
              className="gap-1.5 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50 text-xs font-medium px-3.5 h-10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}

          <Button variant="outline" onClick={() => window.print()} className="gap-1.5 rounded-xl text-xs h-10">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* Edit Form Modal Overlay */}
      {isEditing && (
        <Card className="p-6 border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl">
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-[#0B5FFF]" /> Edit Material Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Material Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="Panels">Panels</option>
                  <option value="Structural">Structural</option>
                  <option value="Concrete">Concrete</option>
                  <option value="Steel">Steel</option>
                  <option value="Cement">Cement</option>
                  <option value="Aggregates">Aggregates</option>
                  <option value="Piping">Piping</option>
                  <option value="Electrical">Electrical</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">SKU / Code</label>
                <input
                  type="text"
                  value={editForm.sku}
                  onChange={e => setEditForm({ ...editForm, sku: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Estimated Target</label>
                <input
                  type="number"
                  value={editForm.estimatedQuantity}
                  onChange={e => setEditForm({ ...editForm, estimatedQuantity: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={editForm.unit}
                  onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Storage Location / Yard</label>
                <input
                  type="text"
                  placeholder="e.g. Laydown Yard B"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">User Alert Threshold Level ({editForm.unit})</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.reorderLevel}
                  onChange={e => setEditForm({ ...editForm, reorderLevel: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="bg-[#0B5FFF] text-white rounded-xl">Save Parameters</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Critical Low Stock Alert Banner */}
      {isBelowThreshold && (
        <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="h-6 w-6 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-white text-red-700 shadow-2xs">
                  CRITICAL STOCK ALERT
                </span>
                <span className="text-xs text-red-100 font-semibold">
                  Quantity Below Threshold
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1">
                Current Available Balance ({balance.toLocaleString()} {material.unit}) is at or below user alert threshold ({threshold.toLocaleString()} {material.unit})!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              onClick={() => setIsReceiptModalOpen(true)} 
              className="bg-white text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl h-9 px-3 shadow-xs"
            >
              <ArrowDownToLine className="h-4 w-4 mr-1" /> Receive Stock
            </Button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - 2 Spans (Stock Cards, Certificates, Manuals, Photos) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Key Metrics Overview Card */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-[#0B5FFF]" /> Stock Levels & Requirement
              </CardTitle>
              <span className="text-xs font-semibold text-slate-500">
                Threshold Mode: <strong className="text-amber-800 dark:text-amber-300">{threshold.toLocaleString()} {material.unit}</strong>
              </span>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className={isBelowThreshold ? "bg-red-50 dark:bg-red-950/80 p-3.5 rounded-xl border-2 border-red-500 shadow-2xs col-span-2 sm:col-span-1" : "bg-blue-50 dark:bg-blue-950/40 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/50"}>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Available Balance</span>
                <span className={`text-xl font-extrabold block mt-1 ${isBelowThreshold ? 'text-red-600 dark:text-red-400 flex items-center gap-1' : 'text-[#0B5FFF] dark:text-blue-400'}`}>
                  {isBelowThreshold && <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />}
                  {balance.toLocaleString()}
                </span>
                <span className={`text-[11px] font-semibold ${isBelowThreshold ? 'text-red-600 dark:text-red-300' : 'text-slate-500'}`}>
                  {isBelowThreshold ? '⚠️ Below threshold' : `${material.unit} in stock`}
                </span>
              </div>

              <div className="bg-amber-50/80 dark:bg-amber-950/50 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">Alert Threshold</span>
                <span className="text-xl font-extrabold text-amber-900 dark:text-amber-200 block mt-1">
                  {threshold.toLocaleString()}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{material.unit} minimum</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Target</span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-200 block mt-1">
                  {material.estimatedQuantity.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">{material.unit} target</span>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                <span className="text-[10px] font-bold uppercase text-indigo-500 dark:text-indigo-400 block">Cost / {material.unit}</span>
                <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300 block mt-1">
                  {material.costPerUnit ? formatCurrency(material.costPerUnit, currency || 'USD') : 'N/A'}
                </span>
                <span className="text-[11px] text-indigo-500 font-medium">{material.costPerUnit ? 'Unit Price' : 'Unset'}</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Received</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                  {material.receivedQuantity.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">{material.unit} received</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Used</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 block mt-1">
                  {material.usedQuantity.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">{percentUsed.toFixed(0)}% used</span>
              </div>
            </CardContent>
          </Card>

          {/* Quality & Regulatory Certificates Section */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Quality & Compliance Certificates ({material.certificates?.length || 0})
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setIsCertModalOpen(true)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 rounded-xl font-medium px-3"
              >
                <Plus className="h-3.5 w-3.5" /> Upload Certificate
              </Button>
            </CardHeader>
            <CardContent>
              {(!material.certificates || material.certificates.length === 0) ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <FileCheck className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No quality certificates uploaded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload Mill Test Reports, MSDS, or ISO compliance documents</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {material.certificates.map(cert => (
                    <div key={cert.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{cert.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-semibold">{cert.type || 'Compliance'}</Badge>
                            <span className="text-[10px] text-slate-400">{cert.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={cert.fileUrl} 
                          download={`${cert.title}.pdf`}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Download Certificate"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Delete Certificate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos & Inspection Images Section */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#0B5FFF]" />
                Product & Delivery Photos ({material.photos?.length || 0})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsCapturing(true)}
                  className="text-xs gap-1.5 rounded-xl"
                >
                  <Camera className="h-3.5 w-3.5" /> Take Photo
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => photoFileInputRef.current?.click()}
                  className="bg-[#0B5FFF] hover:bg-blue-600 text-white text-xs gap-1.5 rounded-xl font-medium px-3"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Photo
                </Button>
                <input 
                  type="file" 
                  ref={photoFileInputRef} 
                  accept="image/*" 
                  onChange={handleUploadPhoto} 
                  className="hidden" 
                />
              </div>
            </CardHeader>
            <CardContent>
              {(!material.photos || material.photos.length === 0) ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No material images attached</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attach delivery site photos or quality inspection photos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {material.photos.map((photo, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 h-28">
                      <img 
                        src={photo} 
                        alt={`Material photo ${idx + 1}`} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setPreviewPhoto(photo)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setPreviewPhoto(photo)}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeletePhoto(idx)}
                          className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Manuals & Specs Section */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                Technical Manuals & Specifications ({material.manuals?.length || 0})
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setIsDocModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 rounded-xl font-medium px-3"
              >
                <Plus className="h-3.5 w-3.5" /> Upload Manual
              </Button>
            </CardHeader>
            <CardContent>
              {(!material.manuals || material.manuals.length === 0) ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No technical manuals or data sheets</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload installation manuals, data sheets, or user guides</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {material.manuals.map(doc => (
                    <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 shrink-0">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{doc.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-semibold">{doc.type || 'Specs'}</Badge>
                            <span className="text-[10px] text-slate-400">{doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={doc.fileUrl} 
                          download={`${doc.title}.pdf`}
                          className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                          title="Delete Document"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column - 1 Span (Transaction History & Linked Tasks) */}
        <div className="flex flex-col gap-6">

          {/* Stock Transactions Log */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0B5FFF]" />
                Stock Movements ({myReceipts.length + myUsages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {myReceipts.length === 0 && myUsages.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center">No receipts or usages logged yet.</p>
              ) : (
                [
                  ...myReceipts.map(r => ({ ...r, txType: 'RECEIPT' as const })),
                  ...myUsages.map(u => ({ ...u, txType: 'USAGE' as const }))
                ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(tx => (
                  <div key={tx.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div className="flex gap-2.5 items-start">
                      <div className={`p-1.5 rounded-lg text-white mt-0.5 ${tx.txType === 'RECEIPT' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                        {tx.txType === 'RECEIPT' ? <ArrowDownToLine className="h-3.5 w-3.5" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tx.txType === 'RECEIPT' ? `Received +${tx.quantity} ${material.unit}` : `Used -${tx.quantity} ${material.unit}`}
                        </p>
                        {tx.txType === 'RECEIPT' && tx.supplier && (
                          <p className="text-[11px] text-slate-500">Supplier: {tx.supplier}</p>
                        )}
                        {tx.txType === 'USAGE' && (tx as any).projectId && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {projects.find(p => p.id === (tx as any).projectId)?.name || 'Unknown Project'}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(tx.date).toLocaleDateString()} by {'receivedBy' in tx ? tx.receivedBy : tx.recordedBy}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {material.type === 'Non-Consumable' && (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#0B5FFF]" />
                  Assignment History ({(material.assignments || []).length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 h-8 text-xs font-semibold"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Assign Tool
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                {!(material.assignments && material.assignments.length > 0) ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center">No assignments logged yet.</p>
                ) : (
                  [...(material.assignments || [])]
                  .sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())
                  .map(assign => {
                    const emp = employees.find(e => e.id === assign.employeeId);
                    return (
                      <div key={assign.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                              {emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee'}
                            </p>
                            <p className="text-xs text-slate-500">
                              Assigned: {new Date(assign.assignedDate).toLocaleDateString()}
                            </p>
                            {assign.returnedDate && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Returned: {new Date(assign.returnedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {!assign.returnedDate && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/30"
                              onClick={() => handleReturnTool(assign.id)}
                            >
                              Mark Returned
                            </Button>
                          )}
                        </div>
                        {assign.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-1 bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-100 dark:border-slate-800">
                            {assign.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Linked Construction Tasks */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#0B5FFF]" />
                Assigned Construction Tasks ({linkedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {linkedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3">No construction tasks currently linked to this material.</p>
              ) : (
                linkedTasks.map(task => (
                  <div key={task.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-[#0B5FFF] uppercase">{task.id}</span>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{task.name}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Upload Certificate Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" /> Upload Quality Certificate
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{material.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCertModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certificate Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. ISO 9001 Quality Certificate 2026" 
                  value={certTitle} 
                  onChange={e => setCertTitle(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Certificate Type</label>
                <select 
                  value={certType} 
                  onChange={e => setCertType(e.target.value as any)} 
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="Mill Test Certificate">Mill Test Certificate</option>
                  <option value="MSDS">MSDS (Material Safety Data Sheet)</option>
                  <option value="ISO Certification">ISO Certification</option>
                  <option value="Quality Inspection">Quality Inspection Report</option>
                  <option value="Compliance Certificate">Compliance Certificate</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select File (PDF / Image)</label>
                <input 
                  type="file" 
                  ref={certFileInputRef} 
                  onChange={handleUploadCertificate}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsCertModalOpen(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Upload Technical Manual Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-500" /> Upload Technical Manual / Spec Sheet
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">{material.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDocModalOpen(false)} className="rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Installation & Maintenance Manual v2.1" 
                  value={docTitle} 
                  onChange={e => setDocTitle(e.target.value)} 
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Document Type</label>
                <select 
                  value={docType} 
                  onChange={e => setDocType(e.target.value as any)} 
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="Technical Specs">Technical Specs Data Sheet</option>
                  <option value="Installation Manual">Installation Manual</option>
                  <option value="Safety Guide">Safety & Handling Guide</option>
                  <option value="User Manual">User / Maintenance Manual</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select File (PDF / Doc)</label>
                <input 
                  type="file" 
                  ref={docFileInputRef} 
                  onChange={handleUploadDocument}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
              <Button variant="outline" onClick={() => setIsDocModalOpen(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Receive Stock Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                <ArrowDownToLine className="h-5 w-5" /> Receive Stock
              </CardTitle>
              <p className="text-sm text-slate-500">{material.name}</p>
            </CardHeader>
            <form onSubmit={handleReceiveSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Received</label>
                  <div className="relative">
                    <input name="quantity" type="number" min="0.01" step="0.01" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{material.unit}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Supplier</label>
                  <input name="supplier" type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Delivery Note Number</label>
                  <input name="deliveryNote" type="text" className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                  <textarea name="notes" className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 text-white">Record Receipt</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Usage Stock Modal */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                <ArrowUpFromLine className="h-5 w-5" /> Record Stock Usage
              </CardTitle>
              <p className="text-sm text-slate-500">{material.name}</p>
            </CardHeader>
            <form onSubmit={handleUseSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Used</label>
                  <div className="relative">
                    <input name="quantity" type="number" min="0.01" step="0.01" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{material.unit}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Project / Site Location</label>
                  <select name="projectId" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                    <option value="">Select a project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Usage Notes</label>
                  <textarea name="notes" placeholder="Where or how was this used?" className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsReceiptModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 text-white">Record Receipt</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Usage Stock Modal */}
      {isUsageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                <ArrowUpFromLine className="h-5 w-5" /> Record Stock Usage
              </CardTitle>
              <p className="text-sm text-slate-500">{material.name}</p>
            </CardHeader>
            <form onSubmit={handleUseSubmit}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity Used</label>
                  <div className="relative">
                    <input name="quantity" type="number" min="0.01" step="0.01" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{material.unit}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Project / Site Location</label>
                  <select name="projectId" required className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                    <option value="">Select a project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Usage Notes</label>
                  <textarea name="notes" placeholder="Where or how was this used?" className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsUsageModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-amber-600 text-white">Record Usage</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCapturing && (
        <CameraCapture 
          onCapture={handleCapturePhoto}
          onCancel={() => setIsCapturing(false)}
        />
      )}

      {/* Assign Tool Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-[#0B5FFF]">
                <UserCheck className="h-5 w-5" /> Assign Tool / Equipment
              </CardTitle>
              <p className="text-sm text-slate-500">{material.name}</p>
            </CardHeader>
            <form onSubmit={handleAssignTool}>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign To Employee *</label>
                  <select 
                    required 
                    value={assignEmployeeId}
                    onChange={e => setAssignEmployeeId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  >
                    <option value="">Select Employee...</option>
                    {employees.filter(emp => emp.status === 'Active').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} - {emp.position}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notes / Condition</label>
                  <textarea 
                    value={assignNotes}
                    onChange={e => setAssignNotes(e.target.value)}
                    placeholder="E.g. Verified working condition before handover"
                    className="w-full h-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" 
                  />
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white font-semibold">Assign Tool</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Photo Lightbox Preview */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <a 
                href={previewPhoto} 
                download={`material-photo-${material.id}.jpg`} 
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full"
              >
                <Download className="h-5 w-5" />
              </a>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="p-2 bg-black/60 text-white hover:bg-black/80 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <img 
              src={previewPhoto} 
              alt="Material photo preview" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
            />
          </div>
        </div>
      )}

    </div>
  );
}
