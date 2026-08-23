import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, CustomSelect } from '../ui';
import { 
  Compass, 
  DollarSign, 
  Truck, 
  Package, 
  Home, 
  ShieldCheck, 
  FileBarChart, 
  Sparkles, 
  Ruler, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Calendar, 
  FileText, 
  Layers, 
  Building2, 
  Save, 
  Download, 
  TrendingUp, 
  Scale, 
  HardHat, 
  Bookmark, 
  SlidersHorizontal,
  FolderPlus
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { 
  UniversalReportItem, 
  ReportCategory, 
  ReportStatus, 
  ReportTemplateDefinition,
  SurveyReportData, 
  SurveyPointRecord, 
  FinanceReportData, 
  FinanceValuationItem, 
  FleetReportData, 
  FleetEquipmentItem, 
  MaterialsReportData, 
  MaterialInspectionItem, 
  AccommodationReportData, 
  AccommodationInspectionItem, 
  CustomReportData,
  CustomReportSection
} from '../../types';

interface UniversalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: UniversalReportItem | null;
  initialCategory?: ReportCategory;
  onSave: (report: UniversalReportItem) => void;
}

export function UniversalReportModal({ 
  isOpen, 
  onClose, 
  initialReport, 
  initialCategory = 'Survey', 
  onSave 
}: UniversalReportModalProps) {
  const { 
    projects, 
    employees, 
    reportTemplates, 
    addReportTemplate, 
    currentUserProfile 
  } = useAppContext();

  // Selected Category & Template
  const [activeCategory, setActiveCategory] = useState<ReportCategory>(initialReport?.category || initialCategory);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const matched = reportTemplates.find(t => t.category === (initialReport?.category || initialCategory));
    return matched ? matched.id : reportTemplates[0]?.id || 'tpl-srv-asbuilt';
  });

  // Basic Contract Identification
  const [projectId, setProjectId] = useState(initialReport?.projectId || projects[0]?.id || 'PRJ-001');
  const [title, setTitle] = useState(initialReport?.title || 'As-Built Setting-Out & Coordinate Tolerance Check');
  const [documentNumber, setDocumentNumber] = useState(initialReport?.documentNumber || `SRV-ASB-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [revision, setRevision] = useState(initialReport?.revision || 'Rev 0');
  const [date, setDate] = useState(initialReport?.date || new Date().toISOString().split('T')[0]);
  const [submissionDate, setSubmissionDate] = useState(initialReport?.submissionDate || new Date().toISOString().split('T')[0]);
  const [author, setAuthor] = useState(initialReport?.author || 'Dimi Maphanga (Senior Surveyor)');
  const [status, setStatus] = useState<ReportStatus>(initialReport?.status || 'Draft');

  // Stakeholders & Location
  const [location, setLocation] = useState(initialReport?.location || 'Sector 4, Chainage CH 0+200 to CH 0+850');
  const [referenceDrawingNumber, setReferenceDrawingNumber] = useState(initialReport?.referenceDrawingNumber || 'DWG-SRV-SEC4-REV02');
  const [client, setClient] = useState(initialReport?.client || 'Transnet Engineering (Client)');
  const [epc, setEpc] = useState(initialReport?.epc || 'Scedih Engineering (EPC)');
  const [subcontractor, setSubcontractor] = useState(initialReport?.subcontractor || 'Apex Geomatics Subcontractor');
  const [summaryNotes, setSummaryNotes] = useState(initialReport?.summaryNotes || '');

  // -------------------------------------------------------------
  // Discipline 1: Survey & Geospatial State
  // -------------------------------------------------------------
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
  const [surveyAreaM2, setSurveyAreaM2] = useState<string>(initialReport?.data?.surveyAreaM2?.toString() || '');
  const [designCutVolumeM3, setDesignCutVolumeM3] = useState<string>(initialReport?.data?.designCutVolumeM3?.toString() || '');
  const [actualCutVolumeM3, setActualCutVolumeM3] = useState<string>(initialReport?.data?.actualCutVolumeM3?.toString() || '');
  const [designFillVolumeM3, setDesignFillVolumeM3] = useState<string>(initialReport?.data?.designFillVolumeM3?.toString() || '');
  const [actualFillVolumeM3, setActualFillVolumeM3] = useState<string>(initialReport?.data?.actualFillVolumeM3?.toString() || '');
  const [compactionFactor, setCompactionFactor] = useState<string>(initialReport?.data?.compactionFactor?.toString() || '1.15');

  const [surveyPoints, setSurveyPoints] = useState<SurveyPointRecord[]>(initialReport?.data?.points || [
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

  // -------------------------------------------------------------
  // Discipline 2: Finance & Commercial State
  // -------------------------------------------------------------
  const [valuationType, setValuationType] = useState<FinanceReportData['valuationType']>(initialReport?.data?.valuationType || 'Interim Progress Claim');
  const [contractSum, setContractSum] = useState<number>(initialReport?.data?.contractSum || 8500000);
  const [retentionPct, setRetentionPct] = useState<number>(initialReport?.data?.retentionPercentage || 10);
  const [vatPct, setVatPct] = useState<number>(initialReport?.data?.vatPercentage || 15);
  const [currencyCode, setCurrencyCode] = useState<string>(initialReport?.data?.currency || 'ZAR (R)');
  const [financeItems, setFinanceItems] = useState<FinanceValuationItem[]>(initialReport?.data?.items || [
    {
      id: 'BOQ-1',
      itemNumber: '1.1',
      description: 'Site Clearance and Topsoil Stripping (150mm depth)',
      unit: 'm²',
      rate: 45,
      contractQuantity: 25000,
      previousClaimedQty: 18000,
      currentClaimedQty: 5500,
      cumulativeQty: 23500,
      cumulativeAmount: 1057500,
      percentageComplete: 94,
      remarks: 'Near completion'
    },
    {
      id: 'BOQ-2',
      itemNumber: '2.3',
      description: 'Excavation of Cable Trenches in Intermediate Material',
      unit: 'm³',
      rate: 180,
      contractQuantity: 8400,
      previousClaimedQty: 4200,
      currentClaimedQty: 2100,
      cumulativeQty: 6300,
      cumulativeAmount: 1134000,
      percentageComplete: 75,
      remarks: 'Survey verified'
    }
  ]);

  // -------------------------------------------------------------
  // Discipline 3: Fleet & Plant State
  // -------------------------------------------------------------
  const [fleetShift, setFleetShift] = useState<FleetReportData['shift']>(initialReport?.data?.shift || 'Day Shift');
  const [fleetList, setFleetList] = useState<FleetEquipmentItem[]>(initialReport?.data?.equipmentList || [
    {
      id: 'EQ-1',
      equipmentId: 'EXC-01',
      name: 'CAT 320D Hydraulic Excavator',
      category: 'Earthmoving',
      registrationNumber: 'DX-44-BB-GP',
      operatorName: 'Sipho Zulu',
      startHourMeter: 4820.5,
      endHourMeter: 4830.0,
      operatingHours: 9.5,
      idleHours: 0.5,
      fuelAddedLiters: 210,
      locationArea: 'Sector 4 Trenching',
      status: 'Operational'
    }
  ]);

  // -------------------------------------------------------------
  // Discipline 4: Materials State
  // -------------------------------------------------------------
  const [materialsDiscipline, setMaterialsDiscipline] = useState<MaterialsReportData['discipline']>(initialReport?.data?.discipline || 'Civil / Structural Steel');
  const [materialsList, setMaterialsList] = useState<MaterialInspectionItem[]>(initialReport?.data?.materials || [
    {
      id: 'MAT-1',
      materialName: 'High Tensile Deformed Steel Rebar Y16 (12m)',
      specification: 'SANS 920:2011 Grade 500D',
      deliveryNoteNumber: 'DN-AMSA-98124',
      supplier: 'ArcelorMittal South Africa',
      batchNumber: 'HT-2026-0819',
      quantityDelivered: 18,
      unit: 'Tons',
      storageLocation: 'Laydown Yard Bay 3',
      testCertificateAttached: true,
      qualityStatus: 'Conforms / Accepted',
      remarks: 'Tensile test passed'
    }
  ]);

  // -------------------------------------------------------------
  // Discipline 5: Custom Dynamic Sections
  // -------------------------------------------------------------
  const [customSections, setCustomSections] = useState<CustomReportSection[]>(initialReport?.data?.sections || [
    {
      id: 'sec-1',
      title: 'Operational Quantities & Matrix',
      type: 'table',
      columns: [
        { id: 'col-1', header: 'Item / Task Description', type: 'text' },
        { id: 'col-2', header: 'Location / Block', type: 'text' },
        { id: 'col-3', header: 'Quantity Executed', type: 'number', isSummable: true },
        { id: 'col-4', header: 'Unit', type: 'text' },
        { id: 'col-5', header: 'Quality Status', type: 'status' }
      ],
      rows: [
        { 'col-1': 'Trench Bedding Sand Layer', 'col-2': 'Block 20-21', 'col-3': 150, 'col-4': 'm', 'col-5': 'Approved' },
        { 'col-1': 'PVC Cable Duct Installation', 'col-2': 'Block 20-21', 'col-3': 150, 'col-4': 'm', 'col-5': 'Approved' }
      ]
    }
  ]);

  // Save as Template Modal State
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  if (!isOpen) return null;

  // Apply Template Preset
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = reportTemplates.find(t => t.id === templateId);
    if (!tpl) return;

    setActiveCategory(tpl.category);
    setTitle(tpl.defaultTitle);
    setDocumentNumber(`${tpl.docNumberPrefix}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    
    if (tpl.defaultDataPreset) {
      if (tpl.category === 'Survey') {
        setSurveyType(tpl.defaultDataPreset.surveyType || 'As-Built');
        if (tpl.defaultDataPreset.instrument) setInstrument(tpl.defaultDataPreset.instrument);
        if (tpl.defaultDataPreset.maxAllowedHorizontalToleranceMm) setMaxAllowedHorizontalToleranceMm(tpl.defaultDataPreset.maxAllowedHorizontalToleranceMm);
      } else if (tpl.category === 'Finance') {
        setValuationType(tpl.defaultDataPreset.valuationType || 'Interim Progress Claim');
        if (tpl.defaultDataPreset.retentionPercentage) setRetentionPct(tpl.defaultDataPreset.retentionPercentage);
      }
    }
  };

  // Survey Point helper
  const handleUpdateSurveyPoint = (id: string, field: keyof SurveyPointRecord, value: any) => {
    setSurveyPoints(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
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

  const handleAddSurveyPoint = () => {
    const nextIdx = surveyPoints.length + 1;
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
    setSurveyPoints([...surveyPoints, newPoint]);
  };

  // Finance helpers
  const handleUpdateFinanceItem = (id: string, field: keyof FinanceValuationItem, value: any) => {
    setFinanceItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const prevQty = parseFloat(updated.previousClaimedQty as any) || 0;
      const currQty = parseFloat(updated.currentClaimedQty as any) || 0;
      const rate = parseFloat(updated.rate as any) || 0;
      const contractQty = parseFloat(updated.contractQuantity as any) || 1;

      const cumQty = prevQty + currQty;
      const cumAmt = cumQty * rate;
      const pct = Math.round((cumQty / contractQty) * 100);

      return {
        ...updated,
        cumulativeQty: cumQty,
        cumulativeAmount: cumAmt,
        percentageComplete: pct
      };
    }));
  };

  const handleAddFinanceItem = () => {
    const nextIdx = financeItems.length + 1;
    setFinanceItems([
      ...financeItems,
      {
        id: `BOQ-${nextIdx}`,
        itemNumber: `${nextIdx}.1`,
        description: 'New Bill of Quantity Scope Item',
        unit: 'm³',
        rate: 250,
        contractQuantity: 1000,
        previousClaimedQty: 0,
        currentClaimedQty: 100,
        cumulativeQty: 100,
        cumulativeAmount: 25000,
        percentageComplete: 10
      }
    ]);
  };

  // Calculations for Finance
  const totalGrossClaim = financeItems.reduce((sum, item) => sum + (parseFloat(item.currentClaimedQty as any) || 0) * (parseFloat(item.rate as any) || 0), 0);
  const totalCumulativeGross = financeItems.reduce((sum, item) => sum + (item.cumulativeAmount || 0), 0);
  const retentionDeductedAmt = Math.round(totalGrossClaim * (retentionPct / 100));
  const netClaimBeforeTax = totalGrossClaim - retentionDeductedAmt;
  const vatAmount = Math.round(netClaimBeforeTax * (vatPct / 100));
  const netPayableAmount = netClaimBeforeTax + vatAmount;

  // Custom Table Row Helpers
  const handleAddCustomRow = (sectionId: string) => {
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      const newRow: Record<string, any> = {};
      sec.columns?.forEach(c => {
        newRow[c.id] = c.type === 'number' ? 0 : c.type === 'status' ? 'Pending' : '';
      });
      return { ...sec, rows: [...(sec.rows || []), newRow] };
    }));
  };

  const handleUpdateCustomRow = (sectionId: string, rowIdx: number, colId: string, val: any) => {
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== sectionId || !sec.rows) return sec;
      const updatedRows = [...sec.rows];
      updatedRows[rowIdx] = { ...updatedRows[rowIdx], [colId]: val };
      return { ...sec, rows: updatedRows };
    }));
  };

  // Submit Report
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let compiledPayload: any = {};

    if (activeCategory === 'Survey') {
      const dCut = parseFloat(actualCutVolumeM3 || designCutVolumeM3) || 0;
      const dFill = parseFloat(actualFillVolumeM3 || designFillVolumeM3) || 0;
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
        netVolumeBalanceM3: (dCut - dFill) || undefined,
        maxAllowedHorizontalToleranceMm,
        maxAllowedVerticalToleranceMm,
        points: surveyPoints,
        cadDrawingReference: referenceDrawingNumber || undefined,
        surveyNotes: summaryNotes || undefined
      };
      compiledPayload = reportData;
    } else if (activeCategory === 'Finance') {
      const reportData: FinanceReportData = {
        valuationType,
        claimPeriodStart: date,
        claimPeriodEnd: submissionDate,
        contractSum,
        previousCertifiedGross: totalCumulativeGross - totalGrossClaim,
        currentClaimGross: totalGrossClaim,
        cumulativeGross: totalCumulativeGross,
        retentionPercentage: retentionPct,
        retentionDeducted: retentionDeductedAmt,
        netClaimBeforeTax,
        vatPercentage: vatPct,
        vatAmount,
        netPayableAmount,
        currency: currencyCode,
        items: financeItems,
        paymentStatus: 'Submitted',
        commercialRemarks: summaryNotes
      };
      compiledPayload = reportData;
    } else if (activeCategory === 'Fleet') {
      const totalHours = fleetList.reduce((sum, f) => sum + (f.operatingHours || 0), 0);
      const totalFuel = fleetList.reduce((sum, f) => sum + (f.fuelAddedLiters || 0), 0);
      const opCount = fleetList.filter(f => f.status === 'Operational').length;
      const reportData: FleetReportData = {
        reportDate: date,
        shift: fleetShift,
        totalFleetCount: fleetList.length,
        operationalCount: opCount,
        breakdownCount: fleetList.length - opCount,
        standbyCount: 0,
        totalOperatingHours: totalHours,
        totalFuelConsumedLiters: totalFuel,
        fleetAvailabilityPct: fleetList.length > 0 ? Math.round((opCount / fleetList.length) * 100) : 100,
        equipmentList: fleetList,
        maintenanceNotes: summaryNotes
      };
      compiledPayload = reportData;
    } else if (activeCategory === 'Materials') {
      const reportData: MaterialsReportData = {
        reportDate: date,
        discipline: materialsDiscipline,
        totalDeliveriesCount: materialsList.length,
        totalAcceptedQty: materialsList.filter(m => m.qualityStatus === 'Conforms / Accepted').length,
        totalRejectedQty: materialsList.filter(m => m.qualityStatus !== 'Conforms / Accepted').length,
        materials: materialsList,
        warehouseObservations: summaryNotes
      };
      compiledPayload = reportData;
    } else {
      const customData: CustomReportData = {
        templateName: title,
        sections: customSections,
        generalRemarks: summaryNotes
      };
      compiledPayload = customData;
    }

    const reportItem: UniversalReportItem = {
      id: initialReport?.id || `RPT-${Date.now()}`,
      projectId,
      reportType: activeCategory.toUpperCase(),
      category: activeCategory,
      title,
      documentNumber,
      revision,
      date,
      submissionDate,
      author,
      authorRole: 'Author / Engineer',
      status,
      location,
      referenceDrawingNumber,
      client,
      epc,
      subcontractor,
      summaryNotes,
      data: compiledPayload,
      signoffs: initialReport?.signoffs || [
        {
          role: `${author} (Prepared By)`,
          name: author,
          date: submissionDate,
          status: 'Approved',
          notes: 'Report prepared and verified in accordance with site specifications.'
        }
      ]
    };

    onSave(reportItem);
    onClose();
  };

  // Save As New Template Handler
  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: ReportTemplateDefinition = {
      id: `tpl-custom-${Date.now()}`,
      name: newTemplateName.trim(),
      category: activeCategory,
      description: newTemplateDescription.trim() || `Custom company template for ${activeCategory} reporting.`,
      icon: activeCategory === 'Survey' ? 'Compass' : activeCategory === 'Finance' ? 'DollarSign' : activeCategory === 'Fleet' ? 'Truck' : 'FileText',
      defaultTitle: title,
      docNumberPrefix: documentNumber.split('-')[0] || 'RPT',
      isSystemPreset: false,
      createdAt: new Date().toISOString()
    };

    addReportTemplate(newTemplate);
    setIsSaveTemplateModalOpen(false);
    alert(`Template "${newTemplateName}" successfully saved to company library!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-[95vw] lg:max-w-7xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#0B5FFF] flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {initialReport ? 'Edit Company Report' : 'Universal Report & Template Studio'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-discipline reporting engine with custom company templates, formulas, and verification matrix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewTemplateName(title);
                setIsSaveTemplateModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold rounded-xl border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[#0B5FFF]"
            >
              <Bookmark className="h-4 w-4" /> Save as Template
            </Button>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Ribbon */}
        <div className="p-4 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 shrink-0">
            Select Template:
          </span>
          {reportTemplates.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                selectedTemplateId === tpl.id
                  ? 'bg-[#0B5FFF] text-white border-[#0B5FFF] shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tpl.category === 'Survey' ? <Compass className="h-3.5 w-3.5" /> :
               tpl.category === 'Finance' ? <DollarSign className="h-3.5 w-3.5" /> :
               tpl.category === 'Fleet' ? <Truck className="h-3.5 w-3.5" /> :
               tpl.category === 'Materials' ? <Package className="h-3.5 w-3.5" /> :
               tpl.category === 'Accommodation' ? <Home className="h-3.5 w-3.5" /> :
               tpl.category === 'Quality' ? <ShieldCheck className="h-3.5 w-3.5" /> :
               <FileBarChart className="h-3.5 w-3.5" />}
              <span>{tpl.name}</span>
              {!tpl.isSystemPreset && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 text-[9px] font-mono">
                  Custom
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Section 1: Contract Identification */}
          <div className="p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#0B5FFF]" />
                <span>1. Report Header & Contract Identification</span>
              </h3>
              <Badge variant="outline" className="font-mono text-xs text-[#0B5FFF] bg-blue-50 dark:bg-blue-950/40">
                {documentNumber}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
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
                  placeholder="e.g. Interim Payment Certificate & Valuation Claim"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Discipline Category</label>
                <select 
                  value={activeCategory} 
                  onChange={e => setActiveCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-[#0B5FFF]"
                >
                  <option value="Survey">📐 Survey & Geospatial</option>
                  <option value="Finance">💰 Finance & Commercial</option>
                  <option value="Fleet">🚜 Fleet & Heavy Plant</option>
                  <option value="Materials">📦 Materials & Quality</option>
                  <option value="Accommodation">🏠 Accommodation & Camp</option>
                  <option value="Quality">🛡️ QA/QC & Non-Conformance</option>
                  <option value="DailySite">⚡ Custom Operations Matrix</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Report Date</label>
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
                <label className="font-bold text-slate-700 dark:text-slate-300">Author / Inspector</label>
                <CustomSelect
                  value={author}
                  onChange={setAuthor}
                  options={employees.map(emp => ({
                    value: `${emp.firstName} ${emp.lastName}`,
                    label: `${emp.firstName} ${emp.lastName}${emp.position ? ` — ${emp.position}` : ''}`
                  }))}
                  allowCustom={true}
                  placeholder="Select or enter author name"
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

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Site Location / Chainage</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                  placeholder="e.g. Sector 4, Chainage CH 0+200 to CH 0+850"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300">Reference Drawing Number</label>
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

          {/* Section 2: Discipline Specific Interactive Editor */}

          {/* DISCIPLINE A: SURVEY & GEOSPATIAL */}
          {activeCategory === 'Survey' && (
            <div className="space-y-6">
              {/* Instrument & Calibration */}
              <div className="p-6 rounded-3xl bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-teal-600" />
                  <span>2. Geodetic Datum & Instrument Calibration</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Instrument Model</label>
                    <input 
                      type="text" 
                      value={instrument} 
                      onChange={e => setInstrument(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                      placeholder="e.g. Leica TS16 Total Station"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Calibration Expiry Date</label>
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
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Max Allowed Horizontal Tolerance (± mm)</label>
                    <input 
                      type="number" 
                      value={maxAllowedHorizontalToleranceMm} 
                      onChange={e => setMaxAllowedHorizontalToleranceMm(parseInt(e.target.value) || 15)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Max Allowed Vertical Tolerance (± mm)</label>
                    <input 
                      type="number" 
                      value={maxAllowedVerticalToleranceMm} 
                      onChange={e => setMaxAllowedVerticalToleranceMm(parseInt(e.target.value) || 10)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold text-teal-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Control Benchmark Ref</label>
                    <input 
                      type="text" 
                      value={benchmarkRef} 
                      onChange={e => setBenchmarkRef(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
                      placeholder="BM-04"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Benchmark Elevation (m)</label>
                    <input 
                      type="number" 
                      step="0.001"
                      value={benchmarkElevation} 
                      onChange={e => setBenchmarkElevation(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Coordinate Matrix Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-teal-600" />
                      <span>Coordinate Point Deviation Matrix ({surveyPoints.length} Points)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Live millimetric offset engine: ΔE, ΔN, ΔZ (mm) with instant tolerance pass/fail.
                    </p>
                  </div>

                  <Button 
                    type="button" 
                    onClick={handleAddSurveyPoint}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Coordinate Row
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold font-sans">
                        <th className="p-3">Point #</th>
                        <th className="p-3">Description / Chainage</th>
                        <th className="p-3 text-right">Design East (m)</th>
                        <th className="p-3 text-right">Design North (m)</th>
                        <th className="p-3 text-right">Design Elev (m)</th>
                        <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act East (m)</th>
                        <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act North (m)</th>
                        <th className="p-3 text-right bg-blue-50/50 dark:bg-blue-950/20">Act Elev (m)</th>
                        <th className="p-3 text-center">ΔE (mm)</th>
                        <th className="p-3 text-center">ΔN (mm)</th>
                        <th className="p-3 text-center">ΔZ (mm)</th>
                        <th className="p-3 text-center font-sans">Status</th>
                        <th className="p-3 text-center font-sans">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {surveyPoints.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2 w-24">
                            <input
                              type="text"
                              value={p.pointNumber}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'pointNumber', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-bold"
                            />
                          </td>
                          <td className="p-2 min-w-[140px] font-sans">
                            <input
                              type="text"
                              value={p.description}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'description', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                              placeholder="e.g. Centerline Peg"
                            />
                          </td>
                          <td className="p-2 w-28 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={p.designEasting}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'designEasting', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-right"
                            />
                          </td>
                          <td className="p-2 w-28 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={p.designNorthing}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'designNorthing', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-right"
                            />
                          </td>
                          <td className="p-2 w-28 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={p.designElevation}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'designElevation', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-right font-bold"
                            />
                          </td>
                          <td className="p-2 w-28 text-right bg-blue-50/30 dark:bg-blue-950/10">
                            <input
                              type="number"
                              step="0.001"
                              value={p.actualEasting}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'actualEasting', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700"
                            />
                          </td>
                          <td className="p-2 w-28 text-right bg-blue-50/30 dark:bg-blue-950/10">
                            <input
                              type="number"
                              step="0.001"
                              value={p.actualNorthing}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'actualNorthing', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700"
                            />
                          </td>
                          <td className="p-2 w-28 text-right bg-blue-50/30 dark:bg-blue-950/10">
                            <input
                              type="number"
                              step="0.001"
                              value={p.actualElevation}
                              onChange={e => handleUpdateSurveyPoint(p.id, 'actualElevation', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-950 text-right font-bold text-blue-700"
                            />
                          </td>
                          
                          <td className={`p-2 text-center font-bold ${Math.abs(p.deltaEasting) > maxAllowedHorizontalToleranceMm ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.deltaEasting > 0 ? `+${p.deltaEasting}` : p.deltaEasting}
                          </td>
                          <td className={`p-2 text-center font-bold ${Math.abs(p.deltaNorthing) > maxAllowedHorizontalToleranceMm ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.deltaNorthing > 0 ? `+${p.deltaNorthing}` : p.deltaNorthing}
                          </td>
                          <td className={`p-2 text-center font-bold ${Math.abs(p.deltaElevation) > maxAllowedVerticalToleranceMm ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {p.deltaElevation > 0 ? `+${p.deltaElevation}` : p.deltaElevation}
                          </td>

                          <td className="p-2 text-center font-sans">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'Pass' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                              {p.status === 'Pass' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                              {p.status}
                            </span>
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setSurveyPoints(surveyPoints.filter(pt => pt.id !== p.id))}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
            </div>
          )}

          {/* DISCIPLINE B: FINANCE & COMMERCIAL */}
          {activeCategory === 'Finance' && (
            <div className="space-y-6">
              {/* Valuation Settings & Summary Banner */}
              <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>2. Commercial Valuation Parameters</span>
                  </h3>
                  <Badge className="bg-emerald-600 text-white font-mono text-xs">
                    Net Payable: {currencyCode} {netPayableAmount.toLocaleString()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Contract Sum ({currencyCode})</label>
                    <input 
                      type="number"
                      value={contractSum}
                      onChange={e => setContractSum(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Retention Percentage (%)</label>
                    <input 
                      type="number"
                      value={retentionPct}
                      onChange={e => setRetentionPct(parseFloat(e.target.value) || 10)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">VAT Percentage (%)</label>
                    <input 
                      type="number"
                      value={vatPct}
                      onChange={e => setVatPct(parseFloat(e.target.value) || 15)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Currency Symbol</label>
                    <input 
                      type="text"
                      value={currencyCode}
                      onChange={e => setCurrencyCode(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* BOQ Items Matrix */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span>Valuation BOQ Items Matrix ({financeItems.length} Items)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Calculates Previous, Current & Cumulative Claim amounts with progress % completion.
                    </p>
                  </div>

                  <Button 
                    type="button" 
                    onClick={handleAddFinanceItem}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add BOQ Item
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                        <th className="p-3 w-16">Item #</th>
                        <th className="p-3">Description of Scope</th>
                        <th className="p-3 w-20">Unit</th>
                        <th className="p-3 text-right font-mono">Rate</th>
                        <th className="p-3 text-right font-mono">Contract Qty</th>
                        <th className="p-3 text-right font-mono">Prev Claimed</th>
                        <th className="p-3 text-right font-mono bg-emerald-50/40 dark:bg-emerald-950/20">Current Claim</th>
                        <th className="p-3 text-right font-mono">Cumulative Qty</th>
                        <th className="p-3 text-right font-mono">Cumulative Amount</th>
                        <th className="p-3 text-center">% Complete</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {financeItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.itemNumber}
                              onChange={e => handleUpdateFinanceItem(item.id, 'itemNumber', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-bold font-mono"
                            />
                          </td>
                          <td className="p-2 min-w-[200px]">
                            <input
                              type="text"
                              value={item.description}
                              onChange={e => handleUpdateFinanceItem(item.id, 'description', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={e => handleUpdateFinanceItem(item.id, 'unit', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-center"
                            />
                          </td>
                          <td className="p-2 w-24">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={e => handleUpdateFinanceItem(item.id, 'rate', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right"
                            />
                          </td>
                          <td className="p-2 w-24">
                            <input
                              type="number"
                              value={item.contractQuantity}
                              onChange={e => handleUpdateFinanceItem(item.id, 'contractQuantity', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right"
                            />
                          </td>
                          <td className="p-2 w-24">
                            <input
                              type="number"
                              value={item.previousClaimedQty}
                              onChange={e => handleUpdateFinanceItem(item.id, 'previousClaimedQty', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right"
                            />
                          </td>
                          <td className="p-2 w-28 bg-emerald-50/40 dark:bg-emerald-950/20">
                            <input
                              type="number"
                              value={item.currentClaimedQty}
                              onChange={e => handleUpdateFinanceItem(item.id, 'currentClaimedQty', e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-950 font-mono font-bold text-emerald-700 text-right"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.cumulativeQty?.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-600">
                            {currencyCode} {item.cumulativeAmount?.toLocaleString()}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-[#0B5FFF]">
                            {item.percentageComplete}%
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setFinanceItems(financeItems.filter(f => f.id !== item.id))}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
            </div>
          )}

          {/* DISCIPLINE C: FLEET & HEAVY MACHINERY */}
          {activeCategory === 'Fleet' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" />
                    <span>Heavy Plant & Machinery Telematics Log ({fleetList.length} Units)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tracks start/end hour meters, fuel liters dispensed, and daily operational availability.
                  </p>
                </div>

                <Button 
                  type="button" 
                  onClick={() => setFleetList([
                    ...fleetList,
                    {
                      id: `EQ-${fleetList.length + 1}`,
                      equipmentId: `EQ-0${fleetList.length + 1}`,
                      name: 'Plant Equipment Unit',
                      category: 'General',
                      startHourMeter: 1000,
                      endHourMeter: 1008,
                      operatingHours: 8,
                      idleHours: 1,
                      fuelAddedLiters: 150,
                      locationArea: 'Site Yard',
                      status: 'Operational'
                    }
                  ])}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Equipment Unit
                </Button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      <th className="p-3">Plant ID & Model</th>
                      <th className="p-3">Operator Name</th>
                      <th className="p-3 text-right font-mono">Start Meter</th>
                      <th className="p-3 text-right font-mono">End Meter</th>
                      <th className="p-3 text-right font-mono">Hours Run</th>
                      <th className="p-3 text-right font-mono">Fuel (Liters)</th>
                      <th className="p-3">Work Location</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {fleetList.map((eq, idx) => (
                      <tr key={eq.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2">
                          <input
                            type="text"
                            value={eq.name}
                            onChange={e => {
                              const updated = [...fleetList];
                              updated[idx].name = e.target.value;
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-semibold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={eq.operatorName || ''}
                            onChange={e => {
                              const updated = [...fleetList];
                              updated[idx].operatorName = e.target.value;
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                            placeholder="Operator name"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            value={eq.startHourMeter}
                            onChange={e => {
                              const updated = [...fleetList];
                              const s = parseFloat(e.target.value) || 0;
                              updated[idx].startHourMeter = s;
                              updated[idx].operatingHours = Math.max(0, updated[idx].endHourMeter - s);
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right"
                          />
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            value={eq.endHourMeter}
                            onChange={e => {
                              const updated = [...fleetList];
                              const endVal = parseFloat(e.target.value) || 0;
                              updated[idx].endHourMeter = endVal;
                              updated[idx].operatingHours = Math.max(0, endVal - updated[idx].startHourMeter);
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right font-bold"
                          />
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-amber-600">
                          {eq.operatingHours} hrs
                        </td>
                        <td className="p-2 w-24">
                          <input
                            type="number"
                            value={eq.fuelAddedLiters}
                            onChange={e => {
                              const updated = [...fleetList];
                              updated[idx].fuelAddedLiters = parseFloat(e.target.value) || 0;
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={eq.locationArea}
                            onChange={e => {
                              const updated = [...fleetList];
                              updated[idx].locationArea = e.target.value;
                              setFleetList(updated);
                            }}
                            className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={eq.status}
                            onChange={e => {
                              const updated = [...fleetList];
                              updated[idx].status = e.target.value as any;
                              setFleetList(updated);
                            }}
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs font-bold"
                          >
                            <option value="Operational">Operational</option>
                            <option value="Standby">Standby</option>
                            <option value="Breakdown / Maintenance">Breakdown</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => setFleetList(fleetList.filter(f => f.id !== eq.id))}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
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
          )}

          {/* DISCIPLINE D: CUSTOM DYNAMIC BLOCKS (For Custom, Quality, Camp & Materials) */}
          {(activeCategory === 'DailySite' || activeCategory === 'Quality' || activeCategory === 'Accommodation' || activeCategory === 'Materials') && (
            <div className="space-y-6">
              {customSections.map((sec) => (
                <div key={sec.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#0B5FFF]" />
                      <span>{sec.title}</span>
                    </h3>

                    <Button 
                      type="button" 
                      onClick={() => handleAddCustomRow(sec.id)}
                      className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-9 gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Add Row
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                          {sec.columns?.map(col => (
                            <th key={col.id} className="p-3">{col.header}</th>
                          ))}
                          <th className="p-3 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {sec.rows?.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            {sec.columns?.map(col => (
                              <td key={col.id} className="p-2">
                                <input
                                  type={col.type === 'number' ? 'number' : 'text'}
                                  value={row[col.id] || ''}
                                  onChange={e => handleUpdateCustomRow(sec.id, rIdx, col.id, col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs"
                                  placeholder={col.header}
                                />
                              </td>
                            ))}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomSections(prev => prev.map(s => {
                                    if (s.id !== sec.id || !s.rows) return s;
                                    return { ...s, rows: s.rows.filter((_, i) => i !== rIdx) };
                                  }));
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
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
              ))}
            </div>
          )}

          {/* Section 3: Summary Notes & Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Technical Remarks & Method Observations
            </label>
            <textarea
              rows={3}
              value={summaryNotes}
              onChange={e => setSummaryNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              placeholder="Record technical observations, QA clearances, or site constraints..."
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNewTemplateName(title);
                setIsSaveTemplateModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl"
            >
              <Bookmark className="h-4 w-4 text-[#0B5FFF]" /> Save as New Company Template
            </Button>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl font-semibold px-8 shadow-md">
                Publish & Save Report
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Save Template Dialog */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-[#0B5FFF]" /> Save Template Preset
            </h3>
            <p className="text-xs text-slate-500">
              Save this customized reporting layout to your company template library for immediate reuse across all projects.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Name</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="e.g. Standard Substation Valuation & Claim Sheet"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-semibold"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Template Description</label>
              <textarea
                rows={2}
                value={newTemplateDescription}
                onChange={e => setNewTemplateDescription(e.target.value)}
                placeholder="Short description of report purpose and required metrics..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsSaveTemplateModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSaveAsTemplate} className="bg-[#0B5FFF] hover:bg-blue-700 text-white rounded-xl">
                Save to Library
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
