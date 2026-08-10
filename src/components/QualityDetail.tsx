import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from './ui';
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
  UserCheck
} from 'lucide-react';
import { QAInspectionItem } from '../types';
import { useAppContext } from '../context/AppContext';

interface QualityDetailProps {
  inspection: QAInspectionItem;
  onSave: (updated: QAInspectionItem) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function QualityDetail({ inspection, onSave, onClose, onDelete }: QualityDetailProps) {
  const { activities, projects, userRole } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'ncr' | 'tests' | 'photos'>('overview');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Modals state
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isNCRModalOpen, setIsNCRModalOpen] = useState(false);
  const [isAddMetricModalOpen, setIsAddMetricModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Inspection State
  const [editForm, setEditForm] = useState<Partial<QAInspectionItem>>({
    title: inspection.title,
    category: inspection.category,
    location: inspection.location,
    inspector: inspection.inspector,
    date: inspection.date,
    activityId: inspection.activityId,
    clientQCRepresentative: inspection.clientQCRepresentative || '',
    clientQCStatus: inspection.clientQCStatus || 'Pending Client Review',
    clientQCNotes: inspection.clientQCNotes || '',
    clientQCSignoffDate: inspection.clientQCSignoffDate || new Date().toISOString().split('T')[0]
  });

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

  const linkedActivity = activities.find(a => a.id === (editForm.activityId || inspection.activityId));
  const linkedProject = projects.find(p => p.id === inspection.projectId);

  const handleSaveEditInspection = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...inspection,
      title: editForm.title || inspection.title,
      category: editForm.category || inspection.category,
      location: editForm.location || inspection.location,
      inspector: editForm.inspector || inspection.inspector,
      date: editForm.date || inspection.date,
      activityId: editForm.activityId,
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
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700">{inspection.category}</Badge>
              {inspection.ncrCode && <Badge variant="danger" className="text-[10px] font-mono">{inspection.ncrCode}</Badge>}
              <Badge variant={inspection.status === 'Passed' ? 'success' : inspection.status === 'Failed' ? 'danger' : 'warning'}>
                {inspection.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{inspection.title}</h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {userRole === 'Manager' && (
            <button
              onClick={() => {
                setEditForm({
                  title: inspection.title,
                  category: inspection.category,
                  location: inspection.location,
                  inspector: inspection.inspector,
                  date: inspection.date,
                  activityId: inspection.activityId,
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

          {inspection.status !== 'Passed' && userRole === 'Manager' && (
            <Button onClick={() => setIsSignoffModalOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Approve QA Signoff
            </Button>
          )}

          {inspection.status !== 'Failed' && userRole === 'Manager' && (
            <Button onClick={() => setIsNCRModalOpen(true)} variant="outline" className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold">
              <AlertTriangle className="h-4 w-4" /> Issue Non-Conformance (NCR)
            </Button>
          )}

          {onDelete && userRole === 'Manager' && (
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
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-[#0B5FFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Overview & QA Specifications
        </button>

        <button
          onClick={() => setActiveTab('ncr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ncr' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Non-Conformance (NCR) & Remediation
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tests' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <Award className="h-4 w-4" /> Lab Test Results & Certificates
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'photos' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
          }`}
        >
          <ImageIcon className="h-4 w-4" /> Photo Evidence Gallery
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
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Inspection Date</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#0B5FFF]" /> {inspection.date}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase block mb-1">Site Location</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-red-500" /> {inspection.location}
                  </span>
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
              {userRole === 'Manager' && (
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" /> Laboratory & NDT Test Parameters
              </h2>
              <p className="text-xs text-slate-500">Quantitative test measurements (e.g., Concrete Slump, Ultrasonic NDT, Pressure tests).</p>
            </div>
            {userRole === 'Manager' && (
              <Button onClick={() => setIsAddMetricModalOpen(true)} className="gap-2 bg-emerald-600 text-white rounded-xl text-xs">
                <Plus className="h-4 w-4" /> Add Test Metric
              </Button>
            )}
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
        </div>
      )}

      {/* TAB 4: PHOTO EVIDENCE GALLERY & LIGHTBOX */}
      {activeTab === 'photos' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" /> Site Inspection Photo Evidence
              </h2>
              <p className="text-xs text-slate-500">Inspection photos and defect markups.</p>
            </div>
            {userRole === 'Manager' && (
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

      {/* EDIT INSPECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspector Name</label>
                  <input
                    type="text"
                    value={editForm.inspector}
                    onChange={e => setEditForm({ ...editForm, inspector: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Client QC Representative</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Client QC Engineer"
                    value={editForm.clientQCRepresentative}
                    onChange={e => setEditForm({ ...editForm, clientQCRepresentative: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
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
                    value={editForm.activityId}
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
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Digital QA Clearance Sign-Off
              </h3>
              <button onClick={() => setIsSignoffModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleApproveInspection} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Approving QA Engineer *</label>
                <input type="text" required value={approvedBy} onChange={e => setApprovedBy(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm" />
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
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
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
    </div>
  );
}
