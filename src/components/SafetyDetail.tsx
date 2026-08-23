import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, CustomSelect } from './ui';
import { 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  Camera, 
  Upload, 
  Edit3, 
  Trash2, 
  Plus, 
  CheckSquare, 
  Printer, 
  X, 
  Eye, 
  AlertCircle,
  FileCheck,
  Building
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SafetyIncident, CorrectiveAction, canUserEditSection } from '../types';

interface SafetyDetailProps {
  incident: SafetyIncident;
  onSave: (updatedIncident: SafetyIncident) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function SafetyDetail({ incident, onSave, onClose, onDelete }: SafetyDetailProps) {
  const navigate = useNavigate();
  const { userRole, employees, currentUserProfile } = useAppContext();
  const canEditSafety = canUserEditSection(currentUserProfile, 'safety');

  // Active Tab: 'overview' | 'actions' | 'evidence' | 'investigation'
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'evidence' | 'investigation'>('overview');

  // Edit Incident Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<SafetyIncident>({ ...incident });

  // Add / Edit CAPA Action Modal
  const [showCAPAModal, setShowCAPAModal] = useState(false);
  const [editingAction, setEditingAction] = useState<CorrectiveAction | null>(null);
  const [capaForm, setCapaForm] = useState<Partial<CorrectiveAction>>({
    action: '',
    assignedTo: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : 'Site Supervisor',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending'
  });

  // Lightbox Photo State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Investigator Notes Inline Editing
  const [investigatorNotes, setInvestigatorNotes] = useState(incident.investigatorNotes || '');

  // Badges
  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'Critical': return <Badge variant="danger" className="text-xs uppercase font-bold">Critical Risk</Badge>;
      case 'High': return <Badge variant="danger" className="text-xs uppercase font-bold opacity-80">High Risk</Badge>;
      case 'Medium': return <Badge variant="warning" className="text-xs uppercase font-bold">Medium Risk</Badge>;
      case 'Low': return <Badge variant="success" className="text-xs uppercase font-bold">Low Risk</Badge>;
      default: return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Open': return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400">Open</Badge>;
      case 'Under Investigation': return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400">Under Investigation</Badge>;
      case 'Resolved': return <Badge variant="success" className="text-xs">Resolved</Badge>;
      case 'Closed': return <Badge variant="default" className="text-xs bg-slate-200 text-slate-800">Closed</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  // Submit Edit Incident Modal
  const handleEditIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editForm);
    setShowEditModal(false);
  };

  // Submit CAPA Action Add / Edit
  const handleCAPASubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaForm.action) return;

    let updatedActions: CorrectiveAction[] = [];
    if (editingAction) {
      updatedActions = (incident.correctiveActions || []).map(a => 
        a.id === editingAction.id 
          ? {
              ...a,
              action: capaForm.action!,
              assignedTo: capaForm.assignedTo || a.assignedTo,
              dueDate: capaForm.dueDate || a.dueDate,
              status: capaForm.status as any || a.status,
              completedDate: capaForm.status === 'Completed' ? new Date().toISOString().split('T')[0] : a.completedDate
            }
          : a
      );
    } else {
      const newAction: CorrectiveAction = {
        id: `CAPA-${Math.floor(1000 + Math.random() * 9000)}`,
        action: capaForm.action,
        assignedTo: capaForm.assignedTo || 'Site Supervisor',
        dueDate: capaForm.dueDate || new Date().toISOString().split('T')[0],
        status: capaForm.status as any || 'Pending',
        completedDate: capaForm.status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
      };
      updatedActions = [...(incident.correctiveActions || []), newAction];
    }

    onSave({ ...incident, correctiveActions: updatedActions });
    setShowCAPAModal(false);
  };

  // Toggle Action Status
  const handleToggleActionStatus = (actionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    const updatedActions = (incident.correctiveActions || []).map(a => {
      if (a.id === actionId) {
        return {
          ...a,
          status: nextStatus as any,
          completedDate: nextStatus === 'Completed' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return a;
    });

    onSave({ ...incident, correctiveActions: updatedActions });
  };

  // Delete Action
  const handleDeleteAction = (actionId: string) => {
    const updatedActions = (incident.correctiveActions || []).filter(a => a.id !== actionId);
    onSave({ ...incident, correctiveActions: updatedActions });
  };

  // Evidence Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        const updatedPhotos = [...(incident.photos || []), base64Url];
        onSave({ ...incident, photos: updatedPhotos });
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Investigator Notes
  const handleSaveInvestigatorNotes = () => {
    onSave({ ...incident, investigatorNotes });
    alert('Investigation notes saved successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Top App Header Action Bar (Full Width) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onClose ? onClose() : (window.history.length > 1 ? navigate(-1) : navigate('/safety'))}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0"
            title="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-sm">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="font-mono text-xs">{incident.id}</Badge>
                <Badge variant="default" className="bg-red-100 text-red-700 dark:bg-red-900/40 text-xs font-bold">{incident.type}</Badge>
                {getPriorityBadge(incident.priority)}
                {getStatusBadge(incident.status)}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {incident.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {canEditSafety && incident.status !== 'Resolved' && (
            <button
              onClick={() => onSave({ ...incident, status: 'Resolved' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Resolved
            </button>
          )}

          {canEditSafety && (
            <button
              onClick={() => { setCapaForm({ action: '', assignedTo: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : 'Site Supervisor', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Pending' }); setEditingAction(null); setShowCAPAModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Log CAPA Action
            </button>
          )}

          {canEditSafety && (
            <button
              onClick={() => { setEditForm({ ...incident }); setShowEditModal(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              <Edit3 className="h-4 w-4 text-[#0B5FFF]" /> Edit Incident
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="h-4 w-4 text-slate-500" /> Print Report
          </button>

          {canEditSafety && onDelete && (
            <button
              onClick={() => onDelete(incident.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar (Full Width) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Incident Overview
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'actions'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Corrective Actions (CAPA) ({incident.correctiveActions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Camera className="h-4 w-4" /> Site Photos & Evidence ({incident.photos?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('investigation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'investigation'
              ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" /> Root Cause Investigation
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" /> Incident Specifications & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Incident Title</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{incident.title}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Incident Category</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{incident.type}</p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Project Code</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building className="h-4 w-4 text-slate-400" />
                        {incident.projectId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date & Time Reported</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {incident.dateReported}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Reported By</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-400" />
                        {incident.reportedBy}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Site Location & GPS Coordinates</span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-red-500" />
                        {incident.location || 'Site Location Not Specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Hazard / Incident Description</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    {incident.description || 'No detailed description recorded for this safety incident.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-slate-900 dark:to-slate-800/80 border-red-100 dark:border-slate-800 w-full">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Rating & Status Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Priority Level</span>
                  {getPriorityBadge(incident.priority)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Current Status</span>
                  {getStatusBadge(incident.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Risk Severity Level</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-600 border-red-300">
                    {incident.riskLevel || 'Moderate Risk'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">CAPA Items Logged</span>
                  <Badge variant="default" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 text-[10px]">
                    {incident.correctiveActions?.length || 0} Action Items
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CORRECTIVE ACTIONS (CAPA) */}
      {activeTab === 'actions' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-600" /> Corrective & Preventive Action Items (CAPA)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Assign safety resolution tasks, set target due dates, and track completion status.</p>
            </div>
            <button
              onClick={() => { setCapaForm({ action: '', assignedTo: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}` : 'Site Supervisor', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'Pending' }); setEditingAction(null); setShowCAPAModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Log Action Item
            </button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase tracking-wider text-xs font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Action ID</th>
                    <th className="px-4 py-3">Action Description</th>
                    <th className="px-4 py-3">Assigned Person</th>
                    <th className="px-4 py-3">Target Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {(incident.correctiveActions || []).map(act => (
                    <tr key={act.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-purple-600">{act.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{act.action}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {act.assignedTo}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{act.dueDate}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleToggleActionStatus(act.id, act.status)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${
                            act.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400' :
                            act.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400' :
                            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {act.status === 'Completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {act.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingAction(act); setCapaForm({ ...act }); setShowCAPAModal(true); }} className="p-1.5 text-slate-400 hover:text-purple-600">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteAction(act.id)} className="p-1.5 text-slate-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: EVIDENCE & PHOTOS */}
      {activeTab === 'evidence' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#0B5FFF]" /> Incident Evidence & Hazard Photos
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Attach site photos, inspection camera snapshots, and evidence documents.</p>
            </div>
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B5FFF] text-white text-xs font-semibold cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
              <Upload className="h-4 w-4" /> Upload Evidence Photo
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(incident.photos || []).length === 0 ? (
                <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
                  <Camera className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No incident evidence photos attached yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Upload site photos or inspection snapshots using the upload button above.</p>
                </div>
              ) : (
                (incident.photos || []).map((url, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedPhoto(url)}
                    className="group relative h-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer bg-slate-100 dark:bg-slate-800 shadow-sm"
                  >
                    <img src={url} alt={`Incident Evidence ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs">
                      <Eye className="h-5 w-5" /> View Photo
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: ROOT CAUSE INVESTIGATION */}
      {activeTab === 'investigation' && (
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" /> Root Cause Investigation & Supervisor Notes
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Record HSE officer findings, root cause analysis, and preventative recommendations.</p>
            </div>
            <button
              onClick={handleSaveInvestigatorNotes}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <FileCheck className="h-4 w-4" /> Save Findings
            </button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Investigator Findings & Preventative Measures</label>
              <textarea
                rows={6}
                placeholder="Describe root causes (e.g. Unsecured cabling across high-traffic pedestrian walkway), immediate site controls established, and toolbox talk focus items..."
                value={investigatorNotes}
                onChange={e => setInvestigatorNotes(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL 1: EDIT INCIDENT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-red-600" /> Edit Safety Incident Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{editForm.id} - {editForm.title}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditIncidentSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Incident Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category / Type</label>
                  <CustomSelect
                    value={editForm.type}
                    onChange={val => setEditForm({ ...editForm, type: val as any })}
                    options={['Hazard', 'Near Miss', 'Injury', 'Environmental', 'Equipment Damage', 'Quality Non-Conformance']}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    customPlaceholder="Enter custom category..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority Level</label>
                  <select
                    value={editForm.priority}
                    onChange={e => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Low">Low Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Critical">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Detailed Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm">Save Incident</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT CAPA ACTION MODAL */}
      {showCAPAModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-600" />
                {editingAction ? 'Edit CAPA Action Item' : 'Log Corrective Action Item'}
              </h3>
              <button onClick={() => setShowCAPAModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCAPASubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Action Item Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Install safety barrier and warning tape around excavation"
                  value={capaForm.action || ''}
                  onChange={e => setCapaForm({ ...capaForm, action: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Assigned Person</label>
                  <select
                    value={capaForm.assignedTo || ''}
                    onChange={e => setCapaForm({ ...capaForm, assignedTo: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>{emp.firstName} {emp.lastName} ({emp.position})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Due Date *</label>
                  <input
                    type="date"
                    required
                    value={capaForm.dueDate || ''}
                    onChange={e => setCapaForm({ ...capaForm, dueDate: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={capaForm.status || 'Pending'}
                  onChange={e => setCapaForm({ ...capaForm, status: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCAPAModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">Save Action Item</button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* PHOTO LIGHTBOX */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700">
              <X className="h-5 w-5" />
            </button>
            <img src={selectedPhoto} alt="Enlarged Evidence Photo" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
