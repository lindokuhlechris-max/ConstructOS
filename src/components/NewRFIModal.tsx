import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Send, 
  Building2, 
  MapPin, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Ruler, 
  HelpCircle,
  Clock,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { QARFIItem, QARFIType, QARFIStatus, QARFIPriority, QAMeasurementType } from '../types';
import { useAppContext } from '../context/AppContext';
import { Button, Badge, CustomSelect } from './ui';

interface NewRFIModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRFI?: QARFIItem | null;
}

const RFI_TYPES: QARFIType[] = [
  'Request For Inspection (WIR)',
  'Hold Point Clearance',
  'Request For Information (Technical Query)',
  'Material Approval Request',
  'Method Statement Sign-off'
];

const DISCIPLINES = [
  'Earthworks',
  'Concrete',
  'Structural Steel',
  'Civil Utilities',
  'MEP Clearance',
  'Finishes',
  'Survey & Setting Out',
  'Roadworks & Paving'
];

export function NewRFIModal({ isOpen, onClose, initialRFI }: NewRFIModalProps) {
  const { projects, activities, addRFI, updateRFI, currentUserProfile, userRole } = useAppContext();

  const [rfiNumber, setRfiNumber] = useState(
    initialRFI?.rfiNumber || `WIR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [projectId, setProjectId] = useState(initialRFI?.projectId || projects[0]?.id || 'PRJ-001');
  const [activityId, setActivityId] = useState(initialRFI?.activityId || activities[0]?.id || '');
  const [title, setTitle] = useState(initialRFI?.title || '');
  const [rfiType, setRfiType] = useState<QARFIType>(initialRFI?.rfiType || 'Request For Inspection (WIR)');
  const [discipline, setDiscipline] = useState(initialRFI?.discipline || 'Earthworks');
  const [location, setLocation] = useState(initialRFI?.location || '');
  const [requestedBy, setRequestedBy] = useState(
    initialRFI?.requestedBy || currentUserProfile?.name || 'Site QA Engineer'
  );
  const [assignedReviewer, setAssignedReviewer] = useState(
    initialRFI?.assignedReviewer || 'David Smith (Lead QA Consultant)'
  );
  const [dateSubmitted, setDateSubmitted] = useState(
    initialRFI?.dateSubmitted || new Date().toISOString().split('T')[0]
  );
  const [targetResponseDate, setTargetResponseDate] = useState(
    initialRFI?.targetResponseDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<QARFIPriority>(initialRFI?.priority || 'High');
  const [status, setStatus] = useState<QARFIStatus>(initialRFI?.status || 'Submitted');
  
  // Measurement Scope
  const [measurementType, setMeasurementType] = useState<QAMeasurementType>(initialRFI?.measurementType || 'Length');
  const [unit, setUnit] = useState(initialRFI?.unit || 'm');
  const [quantity, setQuantity] = useState<string>(initialRFI?.quantity ? String(initialRFI.quantity) : '150');
  const [toleranceSpec, setToleranceSpec] = useState(initialRFI?.toleranceSpec || '±10mm / SANS 1200');

  const [description, setDescription] = useState(initialRFI?.description || '');
  const [responseClarification, setResponseClarification] = useState(initialRFI?.responseClarification || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const rfiData: QARFIItem = {
      id: initialRFI?.id || `RFI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      rfiNumber,
      projectId,
      activityId,
      title: title.trim(),
      rfiType,
      discipline,
      location: location.trim() || 'Site Wide',
      requestedBy: requestedBy.trim(),
      assignedReviewer: assignedReviewer.trim(),
      dateSubmitted,
      targetResponseDate,
      status,
      priority,
      measurementType,
      unit,
      quantity: parseFloat(quantity) || 0,
      toleranceSpec,
      description: description.trim(),
      responseClarification: responseClarification.trim() || undefined
    };

    if (initialRFI) {
      updateRFI(rfiData);
    } else {
      addRFI(rfiData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[#0B5FFF] shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {initialRFI ? 'Edit Inspection Request (RFI/WIR)' : 'Raise New Request For Inspection (RFI / WIR)'}
              </h3>
              <p className="text-xs text-slate-500">
                Formal work inspection request or technical information query for QA/QC clearance.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">RFI / WIR Number *</label>
              <input
                type="text"
                value={rfiNumber}
                onChange={e => setRfiNumber(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-none focus:border-[#0B5FFF]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Request Type</label>
              <select
                value={rfiType}
                onChange={e => setRfiType(e.target.value as QARFIType)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:border-[#0B5FFF]"
              >
                {RFI_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as QARFIPriority)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:border-[#0B5FFF]"
              >
                <option value="Critical">Critical (Immediate Hold Point)</option>
                <option value="High">High (24-48 Hours)</option>
                <option value="Medium">Medium (3-5 Days)</option>
                <option value="Low">Low (Informational)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Request Title *</label>
            <input
              type="text"
              placeholder="e.g. Work Inspection Request: Trench Depth & Bedding for MV Cable Block 20-21"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:border-[#0B5FFF]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Discipline</label>
              <CustomSelect
                value={discipline}
                onChange={setDiscipline}
                options={DISCIPLINES}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Project</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Linked Activity</label>
              <select
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              >
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Location / Chainage / Grid</label>
              <input
                type="text"
                placeholder="e.g. Block 20 to 21 / Chainage 0+000 to 0+150"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Assigned QA Reviewer / Consultant</label>
              <input
                type="text"
                placeholder="e.g. David Smith (Lead QA Consultant)"
                value={assignedReviewer}
                onChange={e => setAssignedReviewer(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Date Submitted</label>
              <input
                type="date"
                value={dateSubmitted}
                onChange={e => setDateSubmitted(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Target Response Date</label>
              <input
                type="date"
                value={targetResponseDate}
                onChange={e => setTargetResponseDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QARFIStatus)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Approved with Comments">Approved with Comments</option>
                <option value="Rejected / Revise">Rejected / Revise</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Scope & Quantities */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-emerald-600" />
              <span>Inspection Scope & Quantities Requested</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Type</label>
                <select
                  value={measurementType}
                  onChange={e => setMeasurementType(e.target.value as QAMeasurementType)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                >
                  <option value="Length">Length</option>
                  <option value="Volume">Volume</option>
                  <option value="Quantity">Quantity / Nos</option>
                  <option value="Area">Area</option>
                  <option value="Weight">Weight</option>
                  <option value="Thickness">Thickness</option>
                  <option value="Strength">Strength</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Quantity</label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">Tolerance / Spec</label>
                <input
                  type="text"
                  placeholder="e.g. ±10mm / SANS 1200"
                  value={toleranceSpec}
                  onChange={e => setToleranceSpec(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Inspection Scope / Query Description</label>
            <textarea
              rows={3}
              placeholder="Describe work completed, test readiness, inspection criteria, or technical query details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-[#0B5FFF]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Consultant Reviewer Notes / Clarification Response</label>
            <textarea
              rows={2}
              placeholder="Official response, approval remarks, punch list conditions, or technical solution..."
              value={responseClarification}
              onChange={e => setResponseClarification(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:border-[#0B5FFF]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm">
              <Send className="h-3.5 w-3.5" />
              {initialRFI ? 'Update Inspection Request' : 'Submit Inspection Request (RFI)'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default NewRFIModal;
