import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../ui';
import { ShieldCheck, Plus, CheckCircle2, XCircle, AlertCircle, ArrowLeft, FileText, User, Search, Eye, Filter } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { QAInspectionItem } from '../../types';
import { QualityDetail } from '../QualityDetail';

interface QualityModuleProps {
  onBack: () => void;
}

export function QualityModule({ onBack }: QualityModuleProps) {
  const { 
    qaInspections, 
    activities, 
    projects, 
    addQAInspection, 
    updateQAInspection, 
    deleteQAInspection, 
    userRole 
  } = useAppContext();

  const [selectedInspection, setSelectedInspection] = useState<QAInspectionItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Failed' | 'Pending Approval'>('All');

  // Form state
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [activityId, setActivityId] = useState(activities[0]?.id || '');
  const [location, setLocation] = useState('');
  const [inspector, setInspector] = useState('David Smith (QA Engineer)');
  const [category, setCategory] = useState('Concrete');
  const [clientQCRepresentative, setClientQCRepresentative] = useState('');
  const [clientQCStatus, setClientQCStatus] = useState<'Approved' | 'Rejected' | 'Pending Client Review'>('Pending Client Review');

  const filteredInspections = qaInspections.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  const handleAddInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newItem: QAInspectionItem = {
      id: `QA-${Math.floor(200 + Math.random() * 800)}`,
      projectId: projectId || projects[0]?.id || '',
      activityId,
      title,
      location: location || 'Site Wide',
      inspector: inspector || 'QA Inspector',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Approval',
      category: category || 'Concrete',
      clientQCRepresentative,
      clientQCStatus,
      clientQCSignoffDate: new Date().toISOString().split('T')[0]
    };

    addQAInspection(newItem);
    setIsAdding(false);
    setTitle('');
    setLocation('');
    setClientQCRepresentative('');
  };

  const handleStatusChange = (id: string, newStatus: QAInspectionItem['status']) => {
    const target = qaInspections.find(i => i.id === id);
    if (!target) return;

    const updated: QAInspectionItem = {
      ...target,
      status: newStatus,
      ncrCode: newStatus === 'Failed' ? (target.ncrCode || `NCR-2024-${Math.floor(100 + Math.random() * 900)}`) : target.ncrCode,
      ncrDetails: newStatus === 'Failed' ? (target.ncrDetails || {
        ncrNumber: `NCR-2024-${Math.floor(100 + Math.random() * 900)}`,
        deficiencySummary: 'Quality specification non-conformance identified during inspection.',
        status: 'Open'
      }) : target.ncrDetails
    };

    updateQAInspection(updated);
  };

  if (selectedInspection) {
    return (
      <div className="w-full h-full p-4 md:p-6 overflow-y-auto">
        <QualityDetail
          inspection={selectedInspection}
          onSave={(updated) => {
            updateQAInspection(updated);
            setSelectedInspection(updated);
          }}
          onClose={() => setSelectedInspection(null)}
          onDelete={(id) => {
            deleteQAInspection(id);
            setSelectedInspection(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-6 overflow-y-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> Quality & QA/QC Management
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Site inspections, non-conformance reporting (NCR), laboratory test logs, and clearance sign-offs.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search inspections or NCRs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <Button onClick={() => setIsAdding(!isAdding)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0">
            <Plus className="h-4 w-4" /> Log Inspection
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="p-6 border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 w-full">
          <form onSubmit={handleAddInspection} className="flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> New QA/QC Inspection Record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspection Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Pour Formwork & Rebar Check"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Target Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Linked Activity</label>
                <select
                  value={activityId}
                  onChange={e => setActivityId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {activities.map(a => (
                    <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Location / Grid Line</label>
                <input
                  type="text"
                  placeholder="e.g. Grid A1-D4 Level 2"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspector Name</label>
                <input
                  type="text"
                  placeholder="Inspector Name"
                  value={inspector}
                  onChange={e => setInspector(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Inspection Category</label>
                <CustomSelect
                  value={category}
                  onChange={val => setCategory(val)}
                  options={['Concrete', 'Structural Steel', 'Earthworks', 'Civil Utilities', 'Finishes', 'MEP Clearance']}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  customPlaceholder="Enter custom category..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Client QC Representative</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Client Representative"
                  value={clientQCRepresentative}
                  onChange={e => setClientQCRepresentative(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">Client QC Status</label>
                <select
                  value={clientQCStatus}
                  onChange={e => setClientQCStatus(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pending Client Review">Pending Client Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs">
                Submit Inspection Record
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Passed' ? 'All' : 'Passed')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Passed' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{qaInspections.filter(i => i.status === 'Passed').length}</div>
            <div className="text-xs text-slate-500 font-semibold">Passed Inspections</div>
          </div>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'All' : 'Failed')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Failed' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{qaInspections.filter(i => i.status === 'Failed').length}</div>
            <div className="text-xs text-slate-500 font-semibold">Failed / Open NCRs</div>
          </div>
        </Card>

        <Card 
          onClick={() => setStatusFilter(statusFilter === 'Pending Approval' ? 'All' : 'Pending Approval')}
          className={`p-4 flex items-center gap-3 cursor-pointer transition-all border ${
            statusFilter === 'Pending Approval' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{qaInspections.filter(i => i.status === 'Pending Approval').length}</div>
            <div className="text-xs text-slate-500 font-semibold">Pending QA Signoff</div>
          </div>
        </Card>
      </div>

      {/* Inspections List Grid */}
      <div className="flex flex-col gap-3 w-full">
        {filteredInspections.map(item => (
          <Card 
            key={item.id} 
            onClick={() => setSelectedInspection(item)}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-emerald-600">{item.id}</span>
                <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{item.category}</Badge>
                {item.ncrCode && (
                  <Badge variant="danger" className="text-[10px] font-mono">{item.ncrCode}</Badge>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 hover:text-emerald-600 transition-colors">{item.title}</h3>
              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span>Location: <strong className="text-slate-700 dark:text-slate-300">{item.location}</strong></span>
                <span>Inspector: <strong className="text-slate-700 dark:text-slate-300">{item.inspector}</strong></span>
                <span>Date: <strong className="text-slate-700 dark:text-slate-300">{item.date}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.status === 'Passed' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Passed
                </span>
              )}
              {item.status === 'Failed' && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                  <XCircle className="h-4 w-4" /> Failed (NCR)
                </span>
              )}
              {item.status === 'Pending Approval' && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Passed'); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-8 px-3"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(item.id, 'Failed'); }}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs rounded-xl h-8 px-3"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
