import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../components/ui';
import { 
  ShieldAlert, 
  Plus, 
  MapPin, 
  Search, 
  AlertTriangle, 
  User, 
  Calendar, 
  CheckCircle, 
  Eye, 
  FileText, 
  BookOpen, 
  ClipboardCheck, 
  HardHat, 
  FileCheck, 
  CheckSquare, 
  Download, 
  Check, 
  X, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Trash2,
  Edit3,
  Camera
} from 'lucide-react';
import { 
  SafetyIncident, 
  SafetyRequirement, 
  SafetyPolicy, 
  ActivitySafetyInspection, 
  PPEMaterialItem,
  canManage 
} from '../types';
import { SafetyDetail } from '../components/SafetyDetail';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { SafetyInspectionGallery } from '../components/SafetyInspectionGallery';

export function Safety() {
  const { 
    safetyIncidents, 
    projects, 
    activities, 
    safetyRequirements, 
    safetyPolicies, 
    activityInspections, 
    ppeItems, 
    updateSafetyIncident, 
    addSafetyIncident, 
    deleteSafetyIncident, 
    addSafetyRequirement, 
    deleteSafetyRequirement,
    addSafetyPolicy, 
    deleteSafetyPolicy,
    addActivityInspection, 
    updateActivityInspection,
    deleteActivityInspection,
    addPPEItem, 
    updatePPEItem,
    deletePPEItem,
    userRole,
    hasPermission
  } = useAppContext();

  const canEditSafety = hasPermission('safety');

  const [activeTab, setActiveTab] = useState<'incidents' | 'gallery' | 'requirements' | 'policies' | 'inspections' | 'ppe'>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [isReportingIncident, setIsReportingIncident] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAddingReq, setIsAddingReq] = useState(false);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [isAssigningInspection, setIsAssigningInspection] = useState(false);
  const [isAddingPPE, setIsAddingPPE] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string; name: string } | null>(null);

  // New Safety Requirement Form State
  const [reqForm, setReqForm] = useState<Partial<SafetyRequirement>>({
    projectId: projects[0]?.id || '',
    title: '',
    category: 'SWMS',
    description: '',
    mandatoryCertificates: ['White Card'],
    status: 'Active',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // New Safety Policy Form State
  const [policyForm, setPolicyForm] = useState<Partial<SafetyPolicy>>({
    title: '',
    code: `POL-HSE-${Math.floor(10 + Math.random() * 90)}`,
    category: 'General Safety',
    version: 'v1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    summary: ''
  });

  // New Activity Inspection Form State
  const [inspectionForm, setInspectionForm] = useState<Partial<ActivitySafetyInspection>>({
    projectId: projects[0]?.id || '',
    activityId: activities[0]?.id || '',
    title: '',
    inspectorName: 'Current User',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'Scheduled',
    checklistItems: [
      { id: '1', item: 'Site pre-check and hazard isolation complete', passed: true },
      { id: '2', item: 'PPE compliance verified for all team members', passed: true },
      { id: '3', item: 'Emergency equipment & first aid kit accessible', passed: true }
    ],
    notes: ''
  });

  // New PPE Item Form State
  const [ppeForm, setPPEForm] = useState<Partial<PPEMaterialItem>>({
    name: '',
    category: 'Head Protection',
    mandatoryForDisciplines: ['Civil', 'Structural'],
    stockQuantity: 50,
    minStockLevel: 10,
    unit: 'Units'
  });

  // Incident Form state
  const [formData, setFormData] = useState<Partial<SafetyIncident>>({
    projectId: projects[0]?.id || '',
    title: '',
    type: 'Hazard',
    priority: 'Medium',
    status: 'Open',
    dateReported: new Date().toISOString().split('T')[0],
    reportedBy: 'Current User',
    description: '',
    location: '',
  });

  const filteredIncidents = safetyIncidents.filter(incident => 
    incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setFormData(prev => ({
            ...prev,
            gpsLocation: { lat, lng },
            location: `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          }));
        },
        () => alert("Could not get location. Check browser permissions.")
      );
    }
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.type || !formData.priority || !formData.projectId) return;

    addSafetyIncident({
      id: `INC-${Date.now()}`,
      projectId: formData.projectId,
      title: formData.title,
      type: formData.type as any || 'Hazard',
      priority: formData.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      status: 'Open',
      dateReported: formData.dateReported!,
      reportedBy: formData.reportedBy!,
      description: formData.description || '',
      location: formData.location,
      gpsLocation: formData.gpsLocation,
    });

    setIsReportingIncident(false);
  };

  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.title || !reqForm.projectId) return;
    addSafetyRequirement({
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      projectId: reqForm.projectId,
      title: reqForm.title,
      category: reqForm.category as any || 'SWMS',
      description: reqForm.description || '',
      mandatoryCertificates: reqForm.mandatoryCertificates || ['White Card'],
      status: reqForm.status as any || 'Active',
      effectiveDate: reqForm.effectiveDate || new Date().toISOString().split('T')[0]
    });
    setIsAddingReq(false);
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.title || !policyForm.code) return;
    addSafetyPolicy({
      id: `POL-${Math.floor(100 + Math.random() * 900)}`,
      title: policyForm.title,
      code: policyForm.code,
      category: policyForm.category as any || 'General Safety',
      version: policyForm.version || 'v1.0',
      effectiveDate: policyForm.effectiveDate || new Date().toISOString().split('T')[0],
      summary: policyForm.summary || ''
    });
    setIsAddingPolicy(false);
  };

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectionForm.title || !inspectionForm?.activityId) return;
    addActivityInspection({
      id: `INSP-${Math.floor(100 + Math.random() * 900)}`,
      projectId: inspectionForm.projectId || projects[0]?.id || '',
      activityId: inspectionForm?.activityId,
      title: inspectionForm.title,
      inspectorName: inspectionForm.inspectorName || 'Current User',
      scheduledDate: inspectionForm.scheduledDate || new Date().toISOString().split('T')[0],
      status: 'Scheduled',
      checklistItems: inspectionForm.checklistItems || [
        { id: '1', item: 'Site safety pre-check complete', passed: true }
      ],
      notes: inspectionForm.notes || ''
    });
    setIsAssigningInspection(false);
  };

  const handleCreatePPE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppeForm.name) return;
    addPPEItem({
      id: `PPE-${Math.floor(100 + Math.random() * 900)}`,
      name: ppeForm.name,
      category: ppeForm.category as any || 'Head Protection',
      mandatoryForDisciplines: ppeForm.mandatoryForDisciplines || ['Civil'],
      stockQuantity: Number(ppeForm.stockQuantity) || 0,
      minStockLevel: Number(ppeForm.minStockLevel) || 10,
      unit: ppeForm.unit || 'Units'
    });
    setIsAddingPPE(false);
  };

  if (selectedIncident) {
    return (
      <div className="p-4 md:p-6 overflow-y-auto h-full w-full">
        <SafetyDetail
          incident={selectedIncident}
          onSave={canEditSafety ? (updated) => {
            updateSafetyIncident(updated);
            setSelectedIncident(updated);
          } : undefined}
          onClose={() => setSelectedIncident(null)}
          onDelete={canEditSafety ? (id) => {
            const inc = safetyIncidents.find(i => i.id === id);
            setDeletingItem({ type: 'incident', id, name: inc?.title || id });
          } : undefined}
        />
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col h-full w-full p-4 md:p-6 gap-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" /> Site Safety & Compliance Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Manage site hazards, SWMS project requirements, HSE policies, activity inspections, and PPE inventory.
          </p>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'incidents' 
                ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="h-4 w-4" /> Incidents & Hazards
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'gallery' 
                ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" /> Inspection Gallery
          </button>
          
          <button
            onClick={() => setActiveTab('requirements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'requirements' 
                ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" /> Project Safety Requirements
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'policies' 
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Safety Policies
          </button>

          <button
            onClick={() => setActiveTab('inspections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'inspections' 
                ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" /> Activity Inspections
          </button>

          <button
            onClick={() => setActiveTab('ppe')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ppe' 
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <HardHat className="h-4 w-4" /> PPE & Equipment
          </button>
        </div>
      </div>

      {/* TAB 0: GALLERY VIEW */}
      {activeTab === 'gallery' && (
        <SafetyInspectionGallery />
      )}

      {/* TAB 1: INCIDENTS & HAZARDS */}
      {activeTab === 'incidents' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search incidents or hazards..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            {canEditSafety && (
              <Button onClick={() => setIsReportingIncident(!isReportingIncident)} className="gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shrink-0">
                {isReportingIncident ? 'Cancel' : <><Plus className="h-4 w-4" /> Report Safety Incident</>}
              </Button>
            )}
          </div>

          {isReportingIncident && (
            <Card className="border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader className="pb-3 border-b border-red-100 dark:border-red-900/20">
                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Report New Safety Hazard / Incident
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleReportIncident} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Incident Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="Brief description of the incident or hazard"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Project</label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Incident Type / Category</label>
                      <CustomSelect
                        value={formData.type || 'Hazard'}
                        onChange={val => setFormData({ ...formData, type: val as any })}
                        options={['Hazard', 'Near Miss', 'Injury', 'Environmental', 'Equipment Damage', 'Quality Non-Conformance']}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        customPlaceholder="Enter custom safety category..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Priority Risk Level</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      >
                        <option value="Low">Low Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="High">High Risk</option>
                        <option value="Critical">Critical Risk</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Specific Site Location</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Trench 4, Substructure Area C"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="flex-1 h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                        <Button type="button" variant="outline" onClick={handleCaptureLocation} className="shrink-0 rounded-lg gap-2" title="Tag Current GPS Location">
                          <MapPin className="h-4 w-4" /> Tag GPS
                        </Button>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Detailed Incident Description</label>
                      <textarea
                        rows={3}
                        placeholder="Describe what happened or the hazard observed..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsReportingIncident(false)}>Cancel</Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white rounded-xl">Submit Safety Report</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Incident List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {filteredIncidents.map(incident => (
              <Card 
                key={incident.id} 
                onClick={() => setSelectedIncident(incident)}
                className="border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500">{incident.id}</span>
                        <Badge variant={incident.priority === 'Critical' || incident.priority === 'High' ? 'danger' : 'warning'}>{incident.priority}</Badge>
                        <Badge variant={incident.status === 'Resolved' ? 'success' : 'outline'}>{incident.status}</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 hover:text-red-600 transition-colors">{incident.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500 font-medium bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {incident.dateReported}</div>
                    <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {incident.reportedBy}</div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" /> 
                      <span className="truncate">{incident.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> View Incident Details
                    </span>

                    {canManage(userRole) && incident.status !== 'Resolved' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); updateSafetyIncident({...incident, status: 'Resolved'}); }}
                        className="h-7 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PROJECT SAFETY REQUIREMENTS (SWMS & High-Risk Permits) */}
      {activeTab === 'requirements' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0B5FFF]" /> Project Safe Work Method Statements (SWMS) & Permits
              </h2>
              <p className="text-xs text-slate-500">Mandatory high-risk compliance certificates and environmental controls per project.</p>
            </div>
            {canManage(userRole) && (
              <Button onClick={() => setIsAddingReq(true)} className="gap-2 bg-[#0B5FFF] text-white rounded-xl">
                <Plus className="h-4 w-4" /> Add Safety Requirement
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {safetyRequirements.map(req => {
              const project = projects.find(p => p.id === req.projectId);

              return (
                <Card key={req.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono font-bold text-[#0B5FFF]">{req.id}</span>
                        <CardTitle className="text-lg font-bold">{req.title}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{req.category}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 flex flex-col gap-4 flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{req.description}</p>

                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      <span className="text-xs font-bold text-slate-400 block w-full mb-1">Mandatory Tickets / Qualifications:</span>
                      {req.mandatoryCertificates?.map(cert => (
                        <Badge key={cert} variant="default" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Check className="h-3 w-3 mr-1 text-emerald-500" /> {cert}
                        </Badge>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {project?.name || req.projectId}</span>
                      {canManage(userRole) && (
                        <button onClick={() => setDeletingItem({ type: 'requirement', id: req.id, name: req.title })} className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ADD SAFETY REQUIREMENT MODAL */}
          {isAddingReq && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#0B5FFF]" /> New Safety Requirement (SWMS / Permit)
                  </h3>
                  <button onClick={() => setIsAddingReq(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateRequirement} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requirement Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Working at Heights SWMS"
                      value={reqForm.title}
                      onChange={e => setReqForm({ ...reqForm, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Project</label>
                      <select
                        value={reqForm.projectId}
                        onChange={e => setReqForm({ ...reqForm, projectId: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={reqForm.category}
                        onChange={e => setReqForm({ ...reqForm, category: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                      >
                        <option value="SWMS">SWMS (Safe Work Method)</option>
                        <option value="Permit to Work">Permit to Work</option>
                        <option value="Site Induction">Site Induction</option>
                        <option value="Environmental Control">Environmental Control</option>
                        <option value="High Risk Work">High Risk Work</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mandatory Qualifications (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. White Card, Working at Heights Ticket"
                      value={reqForm.mandatoryCertificates?.join(', ')}
                      onChange={e => setReqForm({ ...reqForm, mandatoryCertificates: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Requirement Scope & Rules</label>
                    <textarea
                      rows={3}
                      placeholder="Outline mandatory procedures and controls..."
                      value={reqForm.description}
                      onChange={e => setReqForm({ ...reqForm, description: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingReq(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0B5FFF] text-white">Save Requirement</button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COMPANY SAFETY POLICIES */}
      {activeTab === 'policies' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" /> Corporate Health & Safety Policies
              </h2>
              <p className="text-xs text-slate-500">Official workplace health, safety, zero harm, and emergency response directives.</p>
            </div>
            {canManage(userRole) && (
              <Button onClick={() => setIsAddingPolicy(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                <Plus className="h-4 w-4" /> Add Safety Policy
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {safetyPolicies.map(policy => (
              <Card key={policy.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono font-bold text-emerald-600">{policy.code} ({policy.version})</span>
                      <CardTitle className="text-lg font-bold">{policy.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">{policy.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 flex flex-col gap-4 flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{policy.summary}</p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 mt-auto">
                    <span>Effective: {policy.effectiveDate}</span>
                    {canManage(userRole) && (
                      <button onClick={() => setDeletingItem({ type: 'policy', id: policy.id, name: policy.title })} className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ADD POLICY MODAL */}
          {isAddingPolicy && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" /> New Safety Policy
                  </h3>
                  <button onClick={() => setIsAddingPolicy(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePolicy} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Policy Code *</label>
                      <input
                        type="text"
                        required
                        value={policyForm.code}
                        onChange={e => setPolicyForm({ ...policyForm, code: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Version</label>
                      <input
                        type="text"
                        value={policyForm.version}
                        onChange={e => setPolicyForm({ ...policyForm, version: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Policy Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zero Harm & Safety First Directive"
                      value={policyForm.title}
                      onChange={e => setPolicyForm({ ...policyForm, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                    <select
                      value={policyForm.category}
                      onChange={e => setPolicyForm({ ...policyForm, category: e.target.value as any })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="General Safety">General Safety</option>
                      <option value="Working at Heights">Working at Heights</option>
                      <option value="Machinery & Equipment">Machinery & Equipment</option>
                      <option value="PPE Compliance">PPE Compliance</option>
                      <option value="Emergency Response">Emergency Response</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Executive Summary</label>
                    <textarea
                      rows={3}
                      placeholder="Summary of mandatory corporate rules..."
                      value={policyForm.summary}
                      onChange={e => setPolicyForm({ ...policyForm, summary: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingPolicy(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white">Save Policy</button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVITY SAFETY INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" /> Assigned Activity Safety Inspections
              </h2>
              <p className="text-xs text-slate-500">Link safety pre-checks and compliance audits directly to construction activities.</p>
            </div>
            {canManage(userRole) && (
              <Button onClick={() => setIsAssigningInspection(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl">
                <Plus className="h-4 w-4" /> Assign Activity Inspection
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {activityInspections.map(insp => {
              const activity = activities.find(a => a.id === insp?.activityId);

              return (
                <Card key={insp.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono font-bold text-purple-600">{insp.id}</span>
                        <CardTitle className="text-lg font-bold">{insp.title}</CardTitle>
                      </div>
                      <Badge variant={insp.status === 'Passed' ? 'success' : insp.status === 'Failed' ? 'danger' : 'outline'}>
                        {insp.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 flex flex-col gap-4 flex-1">
                    <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 text-xs">
                      <span className="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">Linked Construction Activity:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{activity?.name || insp?.activityId}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 block">Inspection Checklist Items:</span>
                      {insp.checklistItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{item.item}</span>
                          <button
                            onClick={() => {
                              const updatedChecklist = insp.checklistItems.map(c => c.id === item.id ? { ...c, passed: !c.passed } : c);
                              updateActivityInspection({ ...insp, checklistItems: updatedChecklist });
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                          >
                            {item.passed ? 'PASSED ✓' : 'FAILED ✗'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 mt-auto">
                      <span>Inspector: {insp.inspectorName} ({insp.scheduledDate})</span>
                      {canManage(userRole) && (
                        <button onClick={() => setDeletingItem({ type: 'inspection', id: insp.id, name: `${insp.id || insp?.activityId} Inspection` })} className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ASSIGN INSPECTION MODAL */}
          {isAssigningInspection && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-purple-600" /> Assign Activity Inspection
                  </h3>
                  <button onClick={() => setIsAssigningInspection(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateInspection} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspection Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Scaffolding Load & Safety Audit"
                      value={inspectionForm.title}
                      onChange={e => setInspectionForm({ ...inspectionForm, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Link to Construction Activity *</label>
                    <select
                      value={inspectionForm?.activityId}
                      onChange={e => setInspectionForm({ ...inspectionForm, activityId: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {activities.map(a => (
                        <option key={a.id} value={a.id}>{a.id} - {a.name} ({a.workPackage})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inspector Name</label>
                      <input
                        type="text"
                        value={inspectionForm.inspectorName}
                        onChange={e => setInspectionForm({ ...inspectionForm, inspectorName: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scheduled Date</label>
                      <input
                        type="date"
                        value={inspectionForm.scheduledDate}
                        onChange={e => setInspectionForm({ ...inspectionForm, scheduledDate: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAssigningInspection(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white">Assign Inspection</button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PPE & EQUIPMENT */}
      {activeTab === 'ppe' && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-600" /> PPE Inventory & Mandatory Rules
              </h2>
              <p className="text-xs text-slate-500">Track Personal Protective Equipment stock and mandatory trade compliance matrix.</p>
            </div>
            {canManage(userRole) && (
              <Button onClick={() => setIsAddingPPE(true)} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl">
                <Plus className="h-4 w-4" /> Add PPE Item
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {ppeItems.map(item => (
              <Card key={item.id} className="border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">{item.category}</Badge>
                    <span className={`text-xs font-bold ${item.stockQuantity <= item.minStockLevel ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.stockQuantity <= item.minStockLevel ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.name}</h3>

                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Available Stock</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{item.stockQuantity} {item.unit}</span>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">Mandatory Trades:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.mandatoryForDisciplines.map(d => (
                        <Badge key={d} variant="default" className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 flex justify-between items-center text-xs">
                  {canManage(userRole) && (
                    <button onClick={() => setDeletingItem({ type: 'ppe', id: item.id, name: item.name })} className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* ADD PPE MODAL */}
          {isAddingPPE && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg shadow-2xl border-slate-200 dark:border-slate-800">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-amber-600" /> New PPE Equipment Item
                  </h3>
                  <button onClick={() => setIsAddingPPE(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePPE} className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Equipment Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cut-Resistant Kevlar Gloves"
                      value={ppeForm.name}
                      onChange={e => setPPEForm({ ...ppeForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={ppeForm.category}
                        onChange={e => setPPEForm({ ...ppeForm, category: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Head Protection">Head Protection</option>
                        <option value="Eye Protection">Eye Protection</option>
                        <option value="Footwear">Footwear</option>
                        <option value="Fall Arrest">Fall Arrest</option>
                        <option value="Respiratory">Respiratory</option>
                        <option value="High-Vis Clothing">High-Vis Clothing</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Stock</label>
                      <input
                        type="number"
                        value={ppeForm.stockQuantity}
                        onChange={e => setPPEForm({ ...ppeForm, stockQuantity: Number(e.target.value) })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mandatory Disciplines (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Civil, Structural, MEP"
                      value={ppeForm.mandatoryForDisciplines?.join(', ')}
                      onChange={e => setPPEForm({ ...ppeForm, mandatoryForDisciplines: e.target.value.split(',').map(s => s.trim()) })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsAddingPPE(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 text-white">Save PPE Item</button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        title={deletingItem ? `Delete ${deletingItem.type === 'ppe' ? 'PPE Item' : deletingItem.type === 'requirement' ? 'Safety Requirement' : deletingItem.type === 'policy' ? 'Safety Policy' : deletingItem.type === 'inspection' ? 'Safety Inspection' : 'Safety Incident'}` : 'Confirm Delete'}
        itemName={deletingItem?.name || ''}
        message="Are you sure you want to delete this safety record? This action cannot be undone."
        onConfirm={() => {
          if (deletingItem) {
            switch (deletingItem.type) {
              case 'incident':
                if (deleteSafetyIncident) deleteSafetyIncident(deletingItem.id);
                setSelectedIncident(null);
                break;
              case 'requirement':
                deleteSafetyRequirement(deletingItem.id);
                break;
              case 'policy':
                deleteSafetyPolicy(deletingItem.id);
                break;
              case 'inspection':
                deleteActivityInspection(deletingItem.id);
                break;
              case 'ppe':
                deletePPEItem(deletingItem.id);
                break;
            }
          }
          setDeletingItem(null);
        }}
        onCancel={() => setDeletingItem(null)}
        confirmLabel={deletingItem ? `Delete ${deletingItem.type === 'ppe' ? 'PPE Item' : deletingItem.type.charAt(0).toUpperCase() + deletingItem.type.slice(1)}` : 'Delete'}
      />
    </>
  );
}
