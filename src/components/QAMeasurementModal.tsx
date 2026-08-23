import React, { useState, useEffect } from 'react';
import { 
  X, 
  Ruler, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Scale, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  HelpCircle,
  Percent,
  TrendingUp,
  Sliders,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { QAInspectionItem, QAMeasurementType, QAMeasurementRecord } from '../types';
import { Button, Badge, Card } from './ui';

interface QAMeasurementModalProps {
  inspection: QAInspectionItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInspection: QAInspectionItem) => void;
}

const MEASUREMENT_TYPE_CONFIG: Record<QAMeasurementType, { defaultUnit: string; unitOptions: string[]; iconName: string; placeholder: string }> = {
  'Length': { defaultUnit: 'm', unitOptions: ['m', 'lm', 'km', 'ft', 'mm', 'cm'], iconName: 'Ruler', placeholder: 'e.g. 150 meters' },
  'Quantity': { defaultUnit: 'Nos', unitOptions: ['Nos', 'EA', 'Items', 'Sets', 'Units', 'Joints', 'Piles', 'Segments'], iconName: 'Layers', placeholder: 'e.g. 24 items' },
  'Count': { defaultUnit: 'Nos', unitOptions: ['Nos', 'EA', 'Pcs', 'Units', 'Bays', 'Panels'], iconName: 'Layers', placeholder: 'e.g. 100 panels' },
  'Area': { defaultUnit: 'm²', unitOptions: ['m²', 'sqm', 'sq ft', 'ha', 'acres'], iconName: 'Layers', placeholder: 'e.g. 350 sq meters' },
  'Volume': { defaultUnit: 'm³', unitOptions: ['m³', 'cum', 'litres', 'cu yd', 'gallons'], iconName: 'Layers', placeholder: 'e.g. 45 cubic meters' },
  'Weight': { defaultUnit: 'tonnes', unitOptions: ['tonnes', 'kg', 'lbs', 'tons'], iconName: 'Scale', placeholder: 'e.g. 12.5 tonnes' },
  'Percentage': { defaultUnit: '%', unitOptions: ['%'], iconName: 'Percent', placeholder: 'e.g. 100%' },
  'Thickness': { defaultUnit: 'mm', unitOptions: ['mm', 'cm', 'inches', 'm'], iconName: 'Ruler', placeholder: 'e.g. 150 mm' },
  'Strength': { defaultUnit: 'MPa', unitOptions: ['MPa', 'N/mm²', 'psi', 'bar', 'kN'], iconName: 'ShieldCheck', placeholder: 'e.g. 35 MPa' },
  'Temperature': { defaultUnit: '°C', unitOptions: ['°C', '°F', 'K'], iconName: 'Scale', placeholder: 'e.g. 24 °C' },
  'Pressure': { defaultUnit: 'bar', unitOptions: ['bar', 'kPa', 'psi', 'MPa'], iconName: 'Scale', placeholder: 'e.g. 6 bar' },
  'Checklist': { defaultUnit: 'Items', unitOptions: ['Items', 'Points', 'Criteria'], iconName: 'CheckCircle2', placeholder: 'e.g. 8 criteria' },
  'Pass/Fail': { defaultUnit: 'Sign-off', unitOptions: ['Sign-off', 'Verdict', 'Check'], iconName: 'CheckCircle2', placeholder: 'e.g. 1 sign-off' },
  'Custom': { defaultUnit: 'units', unitOptions: ['units', 'tests', 'samples', 'batches'], iconName: 'Sliders', placeholder: 'e.g. 10 units' }
};

export function QAMeasurementModal({ inspection, isOpen, onClose, onSave }: QAMeasurementModalProps) {
  const [measurementType, setMeasurementType] = useState<QAMeasurementType>(inspection.measurementType || 'Length');
  const [unit, setUnit] = useState<string>(inspection.unit || 'm');
  const [targetQuantity, setTargetQuantity] = useState<number>(inspection.targetQuantity || 0);
  const [inspectedQuantity, setInspectedQuantity] = useState<number>(inspection.inspectedQuantity || 0);
  const [approvedQuantity, setApprovedQuantity] = useState<number>(inspection.approvedQuantity || 0);
  const [rejectedQuantity, setRejectedQuantity] = useState<number>(inspection.rejectedQuantity || 0);
  const [toleranceSpec, setToleranceSpec] = useState<string>(inspection.toleranceSpec || '');
  const [measurementItems, setMeasurementItems] = useState<QAMeasurementRecord[]>(inspection.measurementItems || []);

  // Sync with prop updates
  useEffect(() => {
    if (isOpen) {
      setMeasurementType(inspection.measurementType || 'Length');
      setUnit(inspection.unit || MEASUREMENT_TYPE_CONFIG[inspection.measurementType || 'Length'].defaultUnit);
      setTargetQuantity(inspection.targetQuantity || 0);
      setInspectedQuantity(inspection.inspectedQuantity || 0);
      setApprovedQuantity(inspection.approvedQuantity || 0);
      setRejectedQuantity(inspection.rejectedQuantity || 0);
      setToleranceSpec(inspection.toleranceSpec || '');
      setMeasurementItems(inspection.measurementItems || []);
    }
  }, [inspection, isOpen]);

  // Handle measurement type change
  const handleTypeChange = (newType: QAMeasurementType) => {
    setMeasurementType(newType);
    const config = MEASUREMENT_TYPE_CONFIG[newType];
    if (config && !config.unitOptions.includes(unit)) {
      setUnit(config.defaultUnit);
    }
  };

  // Auto calculate calculations
  const approvalPercentage = inspectedQuantity > 0 ? Math.round((approvedQuantity / inspectedQuantity) * 100) : 0;
  const overallApprovalPercentage = targetQuantity > 0 ? Math.round((approvedQuantity / targetQuantity) * 100) : 0;
  const rejectionPercentage = inspectedQuantity > 0 ? Math.round((rejectedQuantity / inspectedQuantity) * 100) : 0;
  const scopeInspectedPercentage = targetQuantity > 0 ? Math.round((inspectedQuantity / targetQuantity) * 100) : 0;
  const remainingScope = Math.max(targetQuantity - inspectedQuantity, 0);

  // Quick preset helper to approve 100% of inspected
  const handleApproveAllInspected = () => {
    setApprovedQuantity(inspectedQuantity);
    setRejectedQuantity(0);
  };

  // Add Itemized Measurement row
  const handleAddItemizedRecord = () => {
    const newRecord: QAMeasurementRecord = {
      id: `MEAS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemDescription: '',
      measurementType: measurementType,
      unit: unit,
      targetOrRequired: 0,
      inspectedAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
      tolerance: toleranceSpec,
      status: 'Pending Inspection',
      inspectionDate: new Date().toISOString().split('T')[0]
    };
    setMeasurementItems(prev => [...prev, newRecord]);
  };

  const handleUpdateItemizedRecord = (id: string, updates: Partial<QAMeasurementRecord>) => {
    setMeasurementItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Auto status determination for item
        if (updated.rejectedAmount > 0) {
          updated.status = updated.approvedAmount > 0 ? 'Partially Approved' : 'Rejected';
        } else if (updated.approvedAmount > 0 && updated.approvedAmount >= (updated.targetOrRequired || updated.inspectedAmount)) {
          updated.status = 'Approved';
        } else if (updated.inspectedAmount > 0) {
          updated.status = 'Pending Inspection';
        }
        return updated;
      }
      return item;
    }));
  };

  const handleDeleteItemizedRecord = (id: string) => {
    setMeasurementItems(prev => prev.filter(item => item.id !== id));
  };

  // Submit Handler
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Auto determine parent QA inspection status if appropriate
    let newStatus = inspection.status;
    if (rejectedQuantity > 0) {
      newStatus = 'Failed';
    } else if (approvedQuantity > 0 && (targetQuantity === 0 || approvedQuantity >= targetQuantity)) {
      newStatus = 'Passed';
    } else if (inspectedQuantity > 0) {
      newStatus = 'Pending Approval';
    }

    const updated: QAInspectionItem = {
      ...inspection,
      measurementType,
      unit,
      targetQuantity: Number(targetQuantity) || 0,
      inspectedQuantity: Number(inspectedQuantity) || 0,
      approvedQuantity: Number(approvedQuantity) || 0,
      rejectedQuantity: Number(rejectedQuantity) || 0,
      toleranceSpec,
      measurementItems,
      status: newStatus
    };

    onSave(updated);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  QA/QC Measurement & Inspection Scope
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-200 text-emerald-600 dark:border-emerald-800">
                  {inspection.id}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[340px] sm:max-w-md">
                {inspection.title}
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

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* 1. Measurement Type & Unit Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              1. Measurement Type & Engineering Unit
            </label>
            
            {/* Quick Type Selection Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(MEASUREMENT_TYPE_CONFIG) as QAMeasurementType[]).slice(0, 8).map(t => {
                const isSelected = measurementType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                    }`}
                  >
                    <span>{t}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {MEASUREMENT_TYPE_CONFIG[t].defaultUnit}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Unit Selector Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Unit of Measure</label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none flex-1"
                  >
                    {MEASUREMENT_TYPE_CONFIG[measurementType]?.unitOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                  {unit === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. joints"
                      onChange={e => setUnit(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none w-28"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tolerance / Spec Constraint</label>
                <input
                  type="text"
                  placeholder="e.g. ±5mm, Min 32.5 MPa, SANS 1200"
                  value={toleranceSpec}
                  onChange={e => setToleranceSpec(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Primary Quantities & Clearance Log */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
                <span>2. Inspected Amounts & Sign-off Quantities</span>
              </label>
              {inspectedQuantity > 0 && (
                <button
                  type="button"
                  onClick={handleApproveAllInspected}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="h-3 w-3" /> Approve All Inspected
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Target Scope */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Required Scope
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={targetQuantity || ''}
                    onChange={e => setTargetQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-lg font-black font-mono text-slate-900 dark:text-white bg-transparent outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0 font-mono">{unit}</span>
                </div>
              </div>

              {/* Inspected Amount */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 bg-blue-50/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Inspected Amount
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={inspectedQuantity || ''}
                    onChange={e => setInspectedQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-lg font-black font-mono text-[#0B5FFF] bg-transparent outline-none border-b border-transparent focus:border-[#0B5FFF]"
                  />
                  <span className="text-xs font-bold text-blue-400 shrink-0 font-mono">{unit}</span>
                </div>
              </div>

              {/* Approved Amount */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                  Approved / Passed
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={approvedQuantity || ''}
                    onChange={e => setApprovedQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 bg-transparent outline-none border-b border-transparent focus:border-emerald-500"
                  />
                  <span className="text-xs font-bold text-emerald-400 shrink-0 font-mono">{unit}</span>
                </div>
              </div>

              {/* Rejected Amount */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 bg-rose-50/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                  Rejected / Failed
                </span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={rejectedQuantity || ''}
                    onChange={e => setRejectedQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full text-lg font-black font-mono text-rose-600 dark:text-rose-400 bg-transparent outline-none border-b border-transparent focus:border-rose-500"
                  />
                  <span className="text-xs font-bold text-rose-400 shrink-0 font-mono">{unit}</span>
                </div>
              </div>
            </div>

            {/* Visual Multi-Segment Quality Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs font-bold flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <span>Overall Scope Approved:</span>
                    <strong className="text-emerald-600 font-mono">
                      {targetQuantity > 0 ? `${overallApprovalPercentage}% of scope` : `${approvalPercentage}%`}
                    </strong>
                  </span>
                  {targetQuantity > 0 && inspectedQuantity > 0 && (
                    <span className="text-slate-400 font-normal text-[11px]">
                      ({approvalPercentage}% of inspected cleared)
                    </span>
                  )}
                </div>
                {rejectedQuantity > 0 && (
                  <span className="text-rose-600 font-mono text-[11px]">
                    {rejectionPercentage}% Defective ({rejectedQuantity} {unit})
                  </span>
                )}
                {targetQuantity > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Remaining Scope: {remainingScope} {unit}
                  </span>
                )}
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                {/* Approved segment */}
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${targetQuantity > 0 ? (approvedQuantity / targetQuantity) * 100 : approvalPercentage}%` }}
                  title={`Approved: ${approvedQuantity} ${unit}`}
                />
                {/* Rejected segment */}
                <div 
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${targetQuantity > 0 ? (rejectedQuantity / targetQuantity) * 100 : rejectionPercentage}%` }}
                  title={`Rejected: ${rejectedQuantity} ${unit}`}
                />
              </div>
            </div>

            {/* Warning if rejected > 0 */}
            {rejectedQuantity > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>
                  <strong>Quality Defect Noted:</strong> {rejectedQuantity} {unit} rejected. This will flag a Non-Conformance (NCR) for rectification.
                </span>
              </div>
            )}
          </div>

          {/* 3. Itemized Sub-Measurements / Test Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  3. Itemized Sub-Measurements & Test Points (Optional)
                </label>
                <p className="text-[11px] text-slate-400">
                  Break down this inspection into multiple test points, layer depths, or segments.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItemizedRecord}
                className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl border-emerald-200 dark:border-emerald-900 text-emerald-600"
              >
                <Plus className="h-3.5 w-3.5" /> Add Test Point
              </Button>
            </div>

            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
              {measurementItems.map((item, idx) => (
                <div 
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder={`Test Point #${idx + 1} Description (e.g. Layer 1 Compaction / Trench Depth)`}
                      value={item.itemDescription}
                      onChange={e => handleUpdateItemizedRecord(item.id, { itemDescription: e.target.value })}
                      className="text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none flex-1 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteItemizedRecord(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Target</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                          type="number"
                          step="any"
                          value={item.targetOrRequired || ''}
                          onChange={e => handleUpdateItemizedRecord(item.id, { targetOrRequired: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold bg-transparent outline-none"
                        />
                        <span className="text-[10px] text-slate-400">{item.unit || unit}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-500 block font-semibold">Inspected</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                        <input
                          type="number"
                          step="any"
                          value={item.inspectedAmount || ''}
                          onChange={e => handleUpdateItemizedRecord(item.id, { inspectedAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold text-[#0B5FFF] bg-transparent outline-none"
                        />
                        <span className="text-[10px] text-blue-400">{item.unit || unit}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-500 block font-semibold">Approved</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                        <input
                          type="number"
                          step="any"
                          value={item.approvedAmount || ''}
                          onChange={e => handleUpdateItemizedRecord(item.id, { approvedAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold text-emerald-600 bg-transparent outline-none"
                        />
                        <span className="text-[10px] text-emerald-400">{item.unit || unit}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-rose-500 block font-semibold">Rejected</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900">
                        <input
                          type="number"
                          step="any"
                          value={item.rejectedAmount || ''}
                          onChange={e => handleUpdateItemizedRecord(item.id, { rejectedAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full font-mono text-xs font-bold text-rose-600 bg-transparent outline-none"
                        />
                        <span className="text-[10px] text-rose-400">{item.unit || unit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {measurementItems.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  No itemized test points added. You can track overall inspection scope above or add specific test points.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" /> Save QA Measurements
            </Button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default QAMeasurementModal;
