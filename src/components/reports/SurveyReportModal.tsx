import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../ui';
import { 
  Ruler, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Calendar, 
  FileText, 
  Layers, 
  Compass, 
  Navigation, 
  Scale, 
  Building2, 
  Upload, 
  Info,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { UniversalReportItem, SurveyReportData, SurveyPointRecord } from '../../types';

interface SurveyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: UniversalReportItem<SurveyReportData> | null;
  onSave: (report: UniversalReportItem<SurveyReportData>) => void;
}

export function SurveyReportModal({ isOpen, onClose, initialReport, onSave }: SurveyReportModalProps) {
  const { projects, employees, currentUserProfile } = useAppContext();

  // Basic Metadata
  const [projectId, setProjectId] = useState(initialReport?.projectId || projects[0]?.id || 'PRJ-001');
  const [title, setTitle] = useState(initialReport?.title || 'As-Built Setting-Out & Coordinate Tolerance Check');
  const [documentNumber, setDocumentNumber] = useState(initialReport?.documentNumber || `SRV-ASB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [revision, setRevision] = useState(initialReport?.revision || 'Rev 0');
  const [date, setDate] = useState(initialReport?.date || new Date().toISOString().split('T')[0]);
  const [submissionDate, setSubmissionDate] = useState(initialReport?.submissionDate || new Date().toISOString().split('T')[0]);
  const [author, setAuthor] = useState(initialReport?.author || 'Dimi Maphanga (Senior Surveyor)');
  const [status, setStatus] = useState<UniversalReportItem['status']>(initialReport?.status || 'Draft');
  
  // Stakeholder & Location
  const [location, setLocation] = useState(initialReport?.location || 'Sector 4, Chainage CH 0+200 to CH 0+850');
  const [referenceDrawingNumber, setReferenceDrawingNumber] = useState(initialReport?.referenceDrawingNumber || 'DWG-SRV-SEC4-REV02');
  const [client, setClient] = useState(initialReport?.client || 'Transnet Engineering (Client)');
  const [epc, setEpc] = useState(initialReport?.epc || 'Scedih Engineering (EPC)');
  const [subcontractor, setSubcontractor] = useState(initialReport?.subcontractor || 'Apex Geomatics Subcontractor');
  const [summaryNotes, setSummaryNotes] = useState(initialReport?.summaryNotes || '');

  // Survey-Specific Data
  const [surveyType, setSurveyType] = useState<SurveyReportData['surveyType']>(initialReport?.data?.surveyType || 'As-Built');
  const [instrument, setInstrument] = useState(initialReport?.data?.instrument || 'Leica TS16 Total Station (1" PinPoint Accuracy)');
  const [instrumentSerialNo, setInstrumentSerialNo] = useState(initialReport?.data?.instrumentSerialNo || 'LCA-TS16-89412');
  const [calibrationDate, setCalibrationDate] = useState(initialReport?.data?.calibrationDate || '2026-06-15');
  const [coordinateSystem, setCoordinateSystem] = useState(initialReport?.data?.coordinateSystem || 'Lo29 / WGS84 Universal Grid');
  const [verticalDatum, setVerticalDatum] = useState(initialReport?.data?.verticalDatum || 'Mean Sea Level (MSL) Benchmark BM-04');
  const [benchmarkRef, setBenchmarkRef] = useState(initialReport?.data?.benchmarkRef || 'BM-04');
  const [benchmarkElevation, setBenchmarkElevation] = useState<string>(initialReport?.data?.benchmarkElevation?.toString() || '1240.550');
  
  const [maxAllowedHorizontalToleranceMm, setMaxAllowedHorizontalToleranceMm] = useState<number>(initialReport?.data?.maxAllowedHorizontalToleranceMm || 15);
  const [maxAllowedVerticalToleranceMm, setMaxAllowedVerticalToleranceMm] = useState<number>(initialReport?.data?.maxAllowedVerticalToleranceMm || 10);
  const [weatherConditions, setWeatherConditions] = useState(initialReport?.data?.weatherConditions || 'Clear, 24°C, Low Atmospheric Refraction');

  // Volumetrics
  const [surveyAreaM2, setSurveyAreaM2] = useState<string>(initialReport?.data?.surveyAreaM2?.toString() || '');
  const [designCutVolumeM3, setDesignCutVolumeM3] = useState<string>(initialReport?.data?.designCutVolumeM3?.toString() || '');
  const [actualCutVolumeM3, setActualCutVolumeM3] = useState<string>(initialReport?.data?.actualCutVolumeM3?.toString() || '');
  const [designFillVolumeM3, setDesignFillVolumeM3] = useState<string>(initialReport?.data?.designFillVolumeM3?.toString() || '');
  const [actualFillVolumeM3, setActualFillVolumeM3] = useState<string>(initialReport?.data?.actualFillVolumeM3?.toString() || '');
  const [compactionFactor, setCompactionFactor] = useState<string>(initialReport?.data?.compactionFactor?.toString() || '1.15');

  // Points Matrix
  const [points, setPoints] = useState<SurveyPointRecord[]>(initialReport?.data?.points || [
    {
      id: 'PT-1',
      pointNumber: 'BM-401',
      description: 'Centerline Peg - Chainage CH 0+200',
      chainage: 'CH 0+200',
      designEasting: 15042.120,
      designNorthing: 84320.500,
      designElevation: 1241.100,
      actualEasting: 15042.124,
      actualNorthing: 84320.503,
      actualElevation: 1241.098,
      deltaEasting: 4,
      deltaNorthing: 3,
      deltaElevation: -2,
      toleranceMm: 15,
      status: 'Pass'
    },
    {
      id: 'PT-2',
      pointNumber: 'BM-402',
      description: 'Offset Peg Left 5.0m - CH 0+350',
      chainage: 'CH 0+350',
      designEasting: 15080.350,
      designNorthing: 84350.220,
      designElevation: 1241.250,
      actualEasting: 15080.358,
      actualNorthing: 84350.225,
      actualElevation: 1241.255,
      deltaEasting: 8,
      deltaNorthing: 5,
      deltaElevation: 5,
      toleranceMm: 15,
      status: 'Pass'
    }
  ]);

  if (!isOpen) return null;

  // Point Calculation helper
  const handleUpdatePoint = (id: string, field: keyof SurveyPointRecord, value: any) => {
    setPoints(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-calculate deltas in mm: (Actual - Design) * 1000
      const dE = parseFloat(updated.designEasting as any) || 0;
      const dN = parseFloat(updated.designNorthing as any) || 0;
      const dZ = parseFloat(updated.designElevation as any) || 0;
      const aE = parseFloat(updated.actualEasting as any) || 0;
      const aN = parseFloat(updated.actualNorthing as any) || 0;
      const aZ = parseFloat(updated.actualElevation as any) || 0;

      const deltaE = Math.round((aE - dE) * 1000);
      const deltaN = Math.round((aN - dN) * 1000);
      const deltaZ = Math.round((aZ - dZ) * 1000);

      const tol = updated.toleranceMm || maxAllowedHorizontalToleranceMm;
      const isPass = Math.abs(deltaE) <= tol && Math.abs(deltaN) <= tol && Math.abs(deltaZ) <= (maxAllowedVerticalToleranceMm || tol);

      return {
        ...updated,
        deltaEasting: deltaE,
        deltaNorthing: deltaN,
        deltaElevation: deltaZ,
        status: isPass ? 'Pass' : 'Out of Tolerance'
      };
    }));
  };

  const handleAddPoint = () => {
    const nextIdx = points.length + 1;
    const newPoint: SurveyPointRecord = {
      id: `PT-${Date.now()}-${nextIdx}`,
      pointNumber: `PT-${nextIdx < 10 ? '0' + nextIdx : nextIdx}`,
      description: 'Point Setting Out',
      chainage: '',
      designEasting: 15000.0,
      designNorthing: 84000.0,
      designElevation: 1240.0,
      actualEasting: 15000.0,
      actualNorthing: 84000.0,
      actualElevation: 1240.0,
      deltaEasting: 0,
      deltaNorthing: 0,
      deltaElevation: 0,
      toleranceMm: maxAllowedHorizontalToleranceMm,
      status: 'Pass'
    };
    setPoints([...points, newPoint]);
  };

  const handleDeletePoint = (id: string) => {
    setPoints(points.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const dCut = parseFloat(actualCutVolumeM3 || designCutVolumeM3) || 0;
    const dFill = parseFloat(actualFillVolumeM3 || designFillVolumeM3) || 0;
    const netVol = dCut - dFill;

    const reportData: SurveyReportData = {
      surveyType,
      instrument,
      instrumentSerialNo: instrumentSerialNo || undefined,
      calibrationDate: calibrationDate || undefined,
      coordinateSystem,
      verticalDatum,
      benchmarkRef: benchmarkRef || undefined,
      benchmarkElevation: parseFloat(benchmarkElevation) || undefined,
      surveyAreaM2: parseFloat(surveyAreaM2) || undefined,
      designCutVolumeM3: parseFloat(designCutVolumeM3) || undefined,
      actualCutVolumeM3: parseFloat(actualCutVolumeM3) || undefined,
      designFillVolumeM3: parseFloat(designFillVolumeM3) || undefined,
      actualFillVolumeM3: parseFloat(actualFillVolumeM3) || undefined,
      compactionFactor: parseFloat(compactionFactor) || undefined,
      netVolumeBalanceM3: netVol || undefined,
      maxAllowedHorizontalToleranceMm,
      maxAllowedVerticalToleranceMm,
      points,
      cadDrawingReference: referenceDrawingNumber || undefined,
      weatherConditions,
      surveyNotes: summaryNotes || undefined
    };

    const reportItem: UniversalReportItem<SurveyReportData> = {
      id: initialReport?.id || `SRV-${Date.now()}`,
      projectId,
      reportType: surveyType === 'Cut & Fill Volume' ? 'SURVEY_CUT_FILL' : 'SURVEY_ASBUILT',
      category: 'Survey',
      title,
      documentNumber,
      revision,
      date,
      submissionDate,
      author,
      authorRole: 'Chief Surveyor',
      status,
      location,
      referenceDrawingNumber,
      client,
      epc,
      subcontractor,
      summaryNotes,
      data: reportData,
      signoffs: initialReport?.signoffs || [
        {
          role: 'Chief Surveyor (Prepared By)',
          name: author,
          date: submissionDate,
          status: 'Approved',
          notes: `Instrument ${instrument} calibrated on ${calibrationDate}.`
        }
      ]
    };

    onSave(reportItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialReport ? 'Edit Survey & Geospatial Report' : 'Create Survey & Geospatial Report'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setting-out, as-built tolerance checking, benchmarks, and cut & fill earthwork records
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: General Report Info */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0B5FFF]" />
                <span>1. Report Header & Contract Identification</span>
              </h3>
              <Badge variant="outline" className="font-mono text-[10px] text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40">
                {documentNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Project</label>
                <select 
                  value={projectId} 
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Report Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                  placeholder="e.g. As-Built Setting-Out & Coordinate Tolerance Check"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Survey Discipline Type</label>
                <select 
                  value={surveyType} 
                  onChange={e => setSurveyType(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-teal-600 dark:text-teal-400"
                >
                  <option value="As-Built">As-Built Tolerance Verification</option>
                  <option value="Setting-Out">Setting-Out / Pegging Check</option>
                  <option value="Cut & Fill Volume">Cut & Fill Earthwork Volumetrics</option>
                  <option value="Topographical">Topographical Site Survey</option>
                  <option value="Monitoring">Structural Deformation Monitoring</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Survey Date</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Submission Date</label>
                <input 
                  type="date" 
                  value={submissionDate} 
                  onChange={e => setSubmissionDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Surveyor / Author</label>
                <CustomSelect
                  value={author}
                  onChange={setAuthor}
                  options={employees.map(emp => ({
                    value: `${emp.firstName} ${emp.lastName}`,
                    label: `${emp.firstName} ${emp.lastName}${emp.position ? ` — ${emp.position}` : ''}`
                  }))}
                  allowCustom={true}
                  placeholder="Select or enter surveyor name"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Approval Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                >
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted for Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Reference Drawing #</label>
                <input 
                  type="text" 
                  value={referenceDrawingNumber} 
                  onChange={e => setReferenceDrawingNumber(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                  placeholder="e.g. DWG-SRV-SEC4-REV02"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Instrument & Reference System */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-teal-600" />
                <span>2. Geodetic Datum & Instrument Calibration</span>
              </h3>
              <span className="text-[11px] text-slate-400">Quality Assurance Calibration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Instrument / Equipment Model</label>
                <input 
                  type="text" 
                  value={instrument} 
                  onChange={e => setInstrument(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                  placeholder="e.g. Leica TS16 Total Station / Trimble R12 RTK"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Instrument Serial No.</label>
                <input 
                  type="text" 
                  value={instrumentSerialNo} 
                  onChange={e => setInstrumentSerialNo(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  placeholder="e.g. LCA-TS16-89412"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Calibration Expiry / Valid Date</label>
                <input 
                  type="date" 
                  value={calibrationDate} 
                  onChange={e => setCalibrationDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Coordinate Reference System</label>
                <input 
                  type="text" 
                  value={coordinateSystem} 
                  onChange={e => setCoordinateSystem(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                  placeholder="e.g. Lo29 / WGS84 Universal Grid"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Vertical Datum & Bench Mark</label>
                <input 
                  type="text" 
                  value={verticalDatum} 
                  onChange={e => setVerticalDatum(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                  placeholder="e.g. MSL Benchmark BM-04"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Control Benchmark Elevation (m)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={benchmarkElevation} 
                  onChange={e => setBenchmarkElevation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                  placeholder="1240.550"
                />
              </div>
            </div>

            {/* Tolerance settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <label className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
                  Max Allowed Horizontal Tolerance (± mm)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={maxAllowedHorizontalToleranceMm}
                    onChange={e => setMaxAllowedHorizontalToleranceMm(parseInt(e.target.value) || 15)}
                    className="w-24 h-9 px-3 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-950 font-bold font-mono text-center"
                  />
                  <span className="text-slate-500 text-[11px]">Applied to Easting ($E$) & Northing ($N$) deltas</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
                <label className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
                  Max Allowed Vertical Tolerance (± mm)
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={maxAllowedVerticalToleranceMm}
                    onChange={e => setMaxAllowedVerticalToleranceMm(parseInt(e.target.value) || 10)}
                    className="w-24 h-9 px-3 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-950 font-bold font-mono text-center"
                  />
                  <span className="text-slate-500 text-[11px]">Applied to Elevation ($Z$) levels</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Earthworks Volumetric Calculator (if Cut & Fill) */}
          {surveyType === 'Cut & Fill Volume' && (
            <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-amber-600" />
                  <span>3. Earthworks Cut & Fill Volumetric Summary</span>
                </h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">Volumetric Quantity Engine</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Survey Area ($m^2$)</label>
                  <input 
                    type="number"
                    value={surveyAreaM2}
                    onChange={e => setSurveyAreaM2(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    placeholder="14250"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Design Cut Volume ($m^3$)</label>
                  <input 
                    type="number"
                    value={designCutVolumeM3}
                    onChange={e => setDesignCutVolumeM3(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                    placeholder="8400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Actual Cut Volume ($m^3$)</label>
                  <input 
                    type="number"
                    value={actualCutVolumeM3}
                    onChange={e => setActualCutVolumeM3(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-emerald-700"
                    placeholder="8250"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Actual Fill Volume ($m^3$)</label>
                  <input 
                    type="number"
                    value={actualFillVolumeM3}
                    onChange={e => setActualFillVolumeM3(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-blue-700"
                    placeholder="3050"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Interactive Coordinate Point Matrix */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-[#0B5FFF]" />
                  <span>4. Coordinate Point Deviation Matrix ({points.length} Points)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Deltas $\Delta E, \Delta N, \Delta Z$ calculate automatically in millimeters ($mm$) with instant pass/fail validation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  onClick={handleAddPoint}
                  className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold h-9"
                >
                  <Plus className="h-4 w-4" /> Add Point Row
                </Button>
              </div>
            </div>

            {/* Points Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="p-2.5">Point #</th>
                    <th className="p-2.5">Description / Chainage</th>
                    <th className="p-2.5 font-mono">Design East (m)</th>
                    <th className="p-2.5 font-mono">Design North (m)</th>
                    <th className="p-2.5 font-mono">Design Elev (m)</th>
                    <th className="p-2.5 font-mono bg-blue-50/50 dark:bg-blue-950/20">Act East (m)</th>
                    <th className="p-2.5 font-mono bg-blue-50/50 dark:bg-blue-950/20">Act North (m)</th>
                    <th className="p-2.5 font-mono bg-blue-50/50 dark:bg-blue-950/20">Act Elev (m)</th>
                    <th className="p-2.5 font-mono text-center">$\Delta E$ (mm)</th>
                    <th className="p-2.5 font-mono text-center">$\Delta N$ (mm)</th>
                    <th className="p-2.5 font-mono text-center">$\Delta Z$ (mm)</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
                  {points.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2 w-20">
                        <input
                          type="text"
                          value={p.pointNumber}
                          onChange={e => handleUpdatePoint(p.id, 'pointNumber', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent font-bold text-slate-900 dark:text-white"
                        />
                      </td>
                      <td className="p-2 min-w-[140px] font-sans">
                        <input
                          type="text"
                          value={p.description}
                          onChange={e => handleUpdatePoint(p.id, 'description', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                          placeholder="e.g. Centerline Peg"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          step="0.001"
                          value={p.designEasting}
                          onChange={e => handleUpdatePoint(p.id, 'designEasting', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-right"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          step="0.001"
                          value={p.designNorthing}
                          onChange={e => handleUpdatePoint(p.id, 'designNorthing', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-right"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input
                          type="number"
                          step="0.001"
                          value={p.designElevation}
                          onChange={e => handleUpdatePoint(p.id, 'designElevation', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-right font-semibold"
                        />
                      </td>
                      <td className="p-2 w-28 bg-blue-50/30 dark:bg-blue-950/10">
                        <input
                          type="number"
                          step="0.001"
                          value={p.actualEasting}
                          onChange={e => handleUpdatePoint(p.id, 'actualEasting', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700 dark:text-blue-300"
                        />
                      </td>
                      <td className="p-2 w-28 bg-blue-50/30 dark:bg-blue-950/10">
                        <input
                          type="number"
                          step="0.001"
                          value={p.actualNorthing}
                          onChange={e => handleUpdatePoint(p.id, 'actualNorthing', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700 dark:text-blue-300"
                        />
                      </td>
                      <td className="p-2 w-28 bg-blue-50/30 dark:bg-blue-950/10">
                        <input
                          type="number"
                          step="0.001"
                          value={p.actualElevation}
                          onChange={e => handleUpdatePoint(p.id, 'actualElevation', e.target.value)}
                          className="w-full h-8 px-2 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700 dark:text-blue-300"
                        />
                      </td>
                      
                      {/* Calculated Deltas in mm */}
                      <td className={`p-2 text-center font-bold ${Math.abs(p.deltaEasting) > maxAllowedHorizontalToleranceMm ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaEasting > 0 ? `+${p.deltaEasting}` : p.deltaEasting}
                      </td>
                      <td className={`p-2 text-center font-bold ${Math.abs(p.deltaNorthing) > maxAllowedHorizontalToleranceMm ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaNorthing > 0 ? `+${p.deltaNorthing}` : p.deltaNorthing}
                      </td>
                      <td className={`p-2 text-center font-bold ${Math.abs(p.deltaElevation) > maxAllowedVerticalToleranceMm ? 'text-rose-600 bg-rose-50/60 dark:bg-rose-950/30' : 'text-emerald-600'}`}>
                        {p.deltaElevation > 0 ? `+${p.deltaElevation}` : p.deltaElevation}
                      </td>

                      {/* Status Badge */}
                      <td className="p-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                          p.status === 'Pass' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {p.status === 'Pass' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePoint(p.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove Point"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Survey Notes & Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Surveyor Technical Notes & Observations
            </label>
            <textarea
              rows={3}
              value={summaryNotes}
              onChange={e => setSummaryNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              placeholder="Record any benchmark adjustments, obstruction notes, or site constraints..."
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold px-6 shadow-md">
              Save Survey Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
