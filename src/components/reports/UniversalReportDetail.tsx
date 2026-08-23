import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../ui';
import { 
  Compass, 
  DollarSign, 
  Truck, 
  Package, 
  Home, 
  ShieldCheck, 
  FileBarChart, 
  Printer, 
  Download, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  MapPin, 
  Building2, 
  FileText, 
  Scale, 
  Ruler, 
  Sparkles, 
  Layers, 
  TrendingUp 
} from 'lucide-react';
import { UniversalReportItem, FinanceReportData, SurveyReportData, FleetReportData, MaterialsReportData, AccommodationReportData, CustomReportData } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { UniversalReportPrintStudioModal } from './UniversalReportPrintStudioModal';

interface UniversalReportDetailProps {
  report: UniversalReportItem;
  onClose: () => void;
  onEdit: () => void;
  onDelete?: (id: string) => void;
  onSave?: (updated: UniversalReportItem) => void;
}

export function UniversalReportDetail({ report, onClose, onEdit, onDelete, onSave }: UniversalReportDetailProps) {
  const { currentUserProfile } = useAppContext();
  const [isSignoffModalOpen, setIsSignoffModalOpen] = useState(false);
  const [isPrintStudioOpen, setIsPrintStudioOpen] = useState(false);
  const [signoffNotes, setSignoffNotes] = useState('');

  const handleApproveSignoff = () => {
    if (!onSave) return;
    const newSignoff = {
      role: currentUserProfile?.role || 'Authorized Lead / Consultant',
      name: currentUserProfile?.name || 'Verified Engineer',
      date: new Date().toISOString().split('T')[0],
      status: 'Approved' as const,
      notes: signoffNotes || 'Report findings, quantities, and compliance verified on site.'
    };

    onSave({
      ...report,
      status: 'Approved',
      signoffs: [...(report.signoffs || []), newSignoff]
    });
    setIsSignoffModalOpen(false);
  };

  const exportReportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (report.category === 'Finance') {
      const fData = report.data as FinanceReportData;
      headers = ['ItemNumber', 'Description', 'Unit', 'Rate', 'ContractQty', 'PrevQty', 'CurrentQty', 'CumulativeQty', 'CumulativeAmount', 'PercentComplete'];
      rows = (fData.items || []).map(i => [
        `"${i.itemNumber}"`,
        `"${i.description}"`,
        `"${i.unit}"`,
        i.rate,
        i.contractQuantity,
        i.previousClaimedQty,
        i.currentClaimedQty,
        i.cumulativeQty,
        i.cumulativeAmount,
        `${i.percentageComplete}%`
      ]);
    } else if (report.category === 'Survey') {
      const sData = report.data as SurveyReportData;
      headers = ['PointNumber', 'Description', 'Chainage', 'DesignEast', 'DesignNorth', 'DesignElev', 'ActualEast', 'ActualNorth', 'ActualElev', 'DeltaE_mm', 'DeltaN_mm', 'DeltaZ_mm', 'Status'];
      rows = (sData.points || []).map(p => [
        `"${p.pointNumber}"`,
        `"${p.description}"`,
        `"${p.chainage || ''}"`,
        p.designEasting,
        p.designNorthing,
        p.designElevation,
        p.actualEasting,
        p.actualNorthing,
        p.actualElevation,
        p.deltaEasting,
        p.deltaNorthing,
        p.deltaElevation,
        `"${p.status}"`
      ]);
    } else if (report.category === 'Fleet') {
      const flt = report.data as FleetReportData;
      headers = ['PlantID', 'Name', 'Operator', 'StartMeter', 'EndMeter', 'HoursRun', 'FuelLiters', 'Location', 'Status'];
      rows = (flt.equipmentList || []).map(e => [
        `"${e.equipmentId}"`,
        `"${e.name}"`,
        `"${e.operatorName || ''}"`,
        e.startHourMeter,
        e.endHourMeter,
        e.operatingHours,
        e.fuelAddedLiters,
        `"${e.locationArea}"`,
        `"${e.status}"`
      ]);
    }

    if (headers.length === 0) return;

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.documentNumber}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mr-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Reports
              </button>
              <Badge variant="outline" className="font-mono text-xs text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
                {report.documentNumber}
              </Badge>
              <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {report.revision}
              </Badge>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                report.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                report.status === 'Rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {report.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              {report.category === 'Survey' ? <Compass className="h-6 w-6 text-teal-600" /> :
               report.category === 'Finance' ? <DollarSign className="h-6 w-6 text-emerald-600" /> :
               report.category === 'Fleet' ? <Truck className="h-6 w-6 text-amber-600" /> :
               report.category === 'Materials' ? <Package className="h-6 w-6 text-orange-600" /> :
               report.category === 'Accommodation' ? <Home className="h-6 w-6 text-cyan-600" /> :
               <FileBarChart className="h-6 w-6 text-[#0B5FFF]" />}
              <span>{report.title}</span>
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4 flex-wrap">
              <span>Discipline: <strong className="text-slate-700 dark:text-slate-200">{report.category}</strong></span>
              <span>Date: <strong className="text-slate-700 dark:text-slate-200">{report.date}</strong></span>
              <span>Submitted: <strong className="text-blue-600 dark:text-blue-400 font-mono">{report.submissionDate || report.date}</strong></span>
              <span>Author: <strong className="text-slate-700 dark:text-slate-200">{report.author}</strong></span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <button
              onClick={() => setIsPrintStudioOpen(true)}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Print & PDF Studio"
            >
              <Printer className="h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300 group-hover:text-[#0B5FFF]" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[120px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Print Studio
              </span>
            </button>

            <button
              onClick={exportReportCSV}
              className="group h-9 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Export CSV"
            >
              <Download className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[110px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Export CSV
              </span>
            </button>

            <button
              onClick={onEdit}
              className="group h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
              title="Edit Report"
            >
              <Edit3 className="h-4 w-4 shrink-0 text-[#0B5FFF]" />
              <span className="max-w-0 opacity-0 group-hover:max-w-[90px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                Edit
              </span>
            </button>

            {report.status !== 'Approved' && onSave && (
              <button
                onClick={() => setIsSignoffModalOpen(true)}
                className="group h-9 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
                title="Sign Off & Approve"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                  Approve Signoff
                </span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete Report "${report.title}"?`)) {
                    onDelete(report.id);
                  }
                }}
                className="group h-9 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all duration-300 flex items-center shadow-2xs overflow-hidden"
                title="Delete Report"
              >
                <Trash2 className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="max-w-0 opacity-0 group-hover:max-w-[80px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-semibold overflow-hidden">
                  Delete
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FINANCE VALUATION DETAIL */}
      {report.category === 'Finance' && (
        <div className="space-y-6">
          {/* Finance KPIs */}
          {(() => {
            const fData = report.data as FinanceReportData;
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Contract Sum</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                      {fData.currency || 'R'} {fData.contractSum?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Gross Claim (This Period)</span>
                    <span className="text-xl font-bold text-emerald-600 font-mono">
                      {fData.currency || 'R'} {fData.currentClaimGross?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Retention Held ({fData.retentionPercentage || 10}%)</span>
                    <span className="text-xl font-bold text-amber-600 font-mono">
                      - {fData.currency || 'R'} {fData.retentionDeducted?.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block mb-1">Net Payable Amount</span>
                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                      {fData.currency || 'R'} {fData.netPayableAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* BOQ Table */}
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>Certified Bill of Quantities (BOQ) Progress Schedule</span>
                  </h3>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                          <th className="p-3">Item #</th>
                          <th className="p-3">Description of Work Package</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3 text-right font-mono">Rate</th>
                          <th className="p-3 text-right font-mono">Contract Qty</th>
                          <th className="p-3 text-right font-mono">Previous Qty</th>
                          <th className="p-3 text-right font-mono bg-emerald-50/40 dark:bg-emerald-950/20">Current Qty</th>
                          <th className="p-3 text-right font-mono">Cumulative Qty</th>
                          <th className="p-3 text-right font-mono">Cumulative Amount</th>
                          <th className="p-3 text-center">% Done</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {(fData.items || []).map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold">{item.itemNumber}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{item.description}</td>
                            <td className="p-3 font-mono">{item.unit}</td>
                            <td className="p-3 text-right font-mono">{fData.currency} {item.rate?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono">{item.contractQuantity?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono text-slate-500">{item.previousClaimedQty?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/20">
                              {item.currentClaimedQty?.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-mono font-bold">{item.cumulativeQty?.toLocaleString()}</td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">
                              {fData.currency} {item.cumulativeAmount?.toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-[#0B5FFF]">{item.percentageComplete}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* FLEET LOG DETAIL */}
      {report.category === 'Fleet' && (
        <div className="space-y-6">
          {(() => {
            const flt = report.data as FleetReportData;
            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total Fleet Units</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{flt.totalFleetCount || 0}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Operational Availability</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono">{flt.fleetAvailabilityPct || 0}%</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total Hours Run</span>
                    <span className="text-2xl font-bold text-amber-600 font-mono">{flt.totalOperatingHours || 0} hrs</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Total Fuel Dispensed</span>
                    <span className="text-2xl font-bold text-blue-600 font-mono">{flt.totalFuelConsumedLiters || 0} L</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span>Heavy Plant Machinery & Telematics Matrix</span>
                  </h3>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                          <th className="p-3">Plant ID</th>
                          <th className="p-3">Machine Model</th>
                          <th className="p-3">Operator</th>
                          <th className="p-3 text-right font-mono">Start Meter</th>
                          <th className="p-3 text-right font-mono">End Meter</th>
                          <th className="p-3 text-right font-mono">Hours Run</th>
                          <th className="p-3 text-right font-mono">Fuel Dispensed</th>
                          <th className="p-3">Work Location</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {(flt.equipmentList || []).map(eq => (
                          <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{eq.equipmentId}</td>
                            <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{eq.name}</td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">{eq.operatorName || '-'}</td>
                            <td className="p-3 text-right font-mono">{eq.startHourMeter}</td>
                            <td className="p-3 text-right font-mono font-bold">{eq.endHourMeter}</td>
                            <td className="p-3 text-right font-mono font-bold text-amber-600">{eq.operatingHours} hrs</td>
                            <td className="p-3 text-right font-mono font-bold text-blue-600">{eq.fuelAddedLiters} L</td>
                            <td className="p-3 text-slate-500">{eq.locationArea}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`text-[10px] ${eq.status === 'Operational' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                {eq.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* MATERIALS & QUALITY DETAIL */}
      {report.category === 'Materials' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            <span>Materials Receiving & Quality Conformance Verification</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="p-3">Material Name</th>
                  <th className="p-3">Specification Standard</th>
                  <th className="p-3">Supplier & Batch #</th>
                  <th className="p-3 text-right font-mono">Qty Delivered</th>
                  <th className="p-3">Storage Location</th>
                  <th className="p-3 text-center">Mill Cert</th>
                  <th className="p-3 text-center">QA Conformance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {((report.data as MaterialsReportData)?.materials || []).map(mat => (
                  <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{mat.materialName}</td>
                    <td className="p-3 text-slate-500 font-mono">{mat.specification}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      <div>{mat.supplier}</div>
                      <span className="text-[10px] text-slate-400 font-mono">Batch: {mat.batchNumber}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{mat.quantityDelivered} {mat.unit}</td>
                    <td className="p-3 text-slate-500">{mat.storageLocation}</td>
                    <td className="p-3 text-center">
                      {mat.testCertificateAttached ? (
                        <span className="text-emerald-600 font-bold">Verified</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        {mat.qualityStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Notes */}
      {report.summaryNotes && (
        <div className="p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Technical Remarks & Site Notes
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {report.summaryNotes}
          </p>
        </div>
      )}

      {/* Multi-Signatory Sign-Off Sheet */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Multi-Party Verification & Sign-Off Endorsements</span>
          </h3>
          <span className="text-[11px] text-slate-400">Formal Verification Record</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(report.signoffs && report.signoffs.length > 0) ? (
            report.signoffs.map((sig, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{sig.role}</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Approved</Badge>
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{sig.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">Date: {sig.date}</div>
                {sig.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    "{sig.notes}"
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              No formal signoffs recorded yet. Click "Approve Signoff" to record verification.
            </div>
          )}
        </div>
      </div>

      {/* Signoff Modal */}
      {isSignoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Endorse & Approve Report
            </h3>
            <p className="text-xs text-slate-500">
              Certify that this report's quantities and site recordings comply with contract requirements.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval Comments</label>
              <textarea
                rows={3}
                value={signoffNotes}
                onChange={e => setSignoffNotes(e.target.value)}
                placeholder="e.g. Quantities and levels verified on site against specifications."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsSignoffModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleApproveSignoff} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Report Print & PDF Studio Modal */}
      {isPrintStudioOpen && (
        <UniversalReportPrintStudioModal
          isOpen={isPrintStudioOpen}
          onClose={() => setIsPrintStudioOpen(false)}
          report={report}
          reportType="universal"
        />
      )}
    </div>
  );
}
