import { Activity, DailyReport, DocumentItem, MaterialInventory, Project, AccommodationUnit, AccommodationUtilityLog, Employee } from '../types';
import { calculateAccommodationMonthlyCost, getAccommodationRateDescription } from './pdfAccommodation';

/**
 * Escapes CSV cell content by handling quotes, commas, and line breaks.
 */
function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // Replace double quotes with escaped double quotes
  const escaped = str.replace(/"/g, '""');
  // Wrap in double quotes if it contains commas, newlines, or quotes
  return `"${escaped}"`;
}

/**
 * Utility to trigger browser download of CSV string. Works 100% offline.
 */
function downloadCSVFile(filename: string, csvContent: string) {
  // Add UTF-8 BOM so Excel opens special characters and numbers correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Material Inventory to Excel-ready CSV format
 */
export function exportMaterialsToCSV(materials: MaterialInventory[], projects?: Project[], filenameSuffix?: string) {
  const headers = [
    'Material ID',
    'Material Name',
    'Category',
    'SKU',
    'Unit',
    'Estimated Qty',
    'Received Qty',
    'Used Qty',
    'Available Balance',
    'Reorder Threshold',
    'Stock Status',
    'Usage %',
    'Storage Location / Notes',
    'Needs Reorder'
  ];

  const rows = materials.map(m => {
    const balance = m.receivedQuantity - m.usedQuantity;
    const threshold = m.reorderLevel !== undefined && m.reorderLevel >= 0 
      ? m.reorderLevel 
      : Math.round((m.estimatedQuantity || 100) * 0.1);
    const isLow = balance <= threshold;
    const usagePct = m.estimatedQuantity > 0 ? ((m.usedQuantity / m.estimatedQuantity) * 100).toFixed(1) + '%' : '0%';

    let status = m.status;
    if (balance <= 0) status = 'Out of Stock';
    else if (isLow) status = 'Low Stock';
    else if (m.usedQuantity > m.estimatedQuantity) status = 'Over Estimate';
    else status = 'In Stock';

    return [
      m.id,
      m.name,
      m.category || 'General',
      m.sku || '',
      m.unit || 'pcs',
      m.estimatedQuantity ?? 0,
      m.receivedQuantity ?? 0,
      m.usedQuantity ?? 0,
      balance,
      threshold,
      status,
      usagePct,
      m.location || '',
      isLow ? 'YES (BELOW THRESHOLD)' : 'NO'
    ];
  });

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_materials_inventory_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

/**
 * Export Activities to CSV format
 */
export function exportActivitiesToCSV(activities: Activity[], projects: Project[], filenameSuffix?: string) {
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : projId;
  };

  const headers = [
    'Activity ID',
    'Activity Name',
    'Project ID',
    'Project Name',
    'Discipline',
    'Status',
    'Progress %',
    'Quantity',
    'Unit',
    'Target Quantity',
    'Daily Target Quantity',
    'Start Date',
    'End Date',
    'Priority',
    'Assigned Team',
    'Total Subtasks',
    'Completed Subtasks',
    'Subtask Progress %',
    'Labour Logged Hours',
    'Total Labour Cost',
    'Description'
  ];

  const rows = activities.map(a => {
    const totalSubtasks = a.subtasks?.length || 0;
    const completedSubtasks = a.subtasks?.filter(s => s.status === 'Completed').length || 0;
    const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
    const labourHours = a.labourTracking?.totalHours || 0;
    const labourCost = a.labourTracking?.totalCost || 0;

    return [
      a.id,
      a.name,
      a.projectId || '',
      getProjectName(a.projectId || ''),
      a.discipline,
      a.status,
      `${a.progress}%`,
      a.quantity || 0,
      a.unit || 'units',
      a.targetQuantity || 0,
      a.dailyTargetQuantity || 0,
      a.startDate || '',
      a.endDate || '',
      a.priority || 'Medium',
      a.assignedTeam || 'General Operations',
      totalSubtasks,
      completedSubtasks,
      `${subtaskPct}%`,
      labourHours,
      labourCost,
      a.description || ''
    ];
  });

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_activities_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

/**
 * Export Daily Reports to CSV format
 */
export function exportDailyReportsToCSV(reports: DailyReport[], projects: Project[], filenameSuffix?: string) {
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : projId;
  };

  const headers = [
    'Report ID',
    'Report Date',
    'Project ID',
    'Project Name',
    'Supervisor / Author',
    'Weather Condition',
    'Temperature (°C)',
    'Safety Incidents Count',
    'Total Workers on Site',
    'Work Progress Summary',
    'Delays or Blockers',
    'QA Hold Points / Inspections'
  ];

  const rows = reports.map(r => [
    r.id,
    r.date,
    r.projectId || '',
    getProjectName(r.projectId || ''),
    r.supervisor || r.submittedBy || 'Site Supervisor',
    r.weather?.condition || 'Clear',
    r.weather?.temp || '30',
    r.safety?.incidents || 0,
    r.labour?.totalWorkers || 0,
    r.workSummary || r.notes || '',
    r.delays || r.blockers || 'None',
    r.qaHoldPoints || 'All Hold Points Passed'
  ]);

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_daily_reports_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

export const exportReportsToCSV = exportDailyReportsToCSV;

/**
 * Comprehensive Multi-Section Site CSV Export
 */
export function exportComprehensiveSiteCSV(
  projects: Project[],
  activities: Activity[],
  materials: MaterialInventory[],
  reports: DailyReport[],
  selectedProjectId?: string
) {
  const filteredProjects = selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects;
  const filteredActivities = selectedProjectId ? activities.filter(a => a.projectId === selectedProjectId) : activities;
  const filteredMaterials = selectedProjectId ? materials.filter(m => m.projectId === selectedProjectId) : materials;
  const filteredReports = selectedProjectId ? reports.filter(r => r.projectId === selectedProjectId) : reports;
  const dateStr = new Date().toISOString().split('T')[0];
  const sections: string[] = [];

  // Summary Metadata
  const projName = selectedProjectId ? (projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId) : 'All Projects';
  
  sections.push(['CONSTRUCTFIELD SITE EXPORT SUMMARY'].map(escapeCSVCell).join(','));
  sections.push(['Export Date', dateStr].map(escapeCSVCell).join(','));
  sections.push(['Project Scope', projName].map(escapeCSVCell).join(','));
  sections.push(['Total Activities', filteredActivities.length].map(escapeCSVCell).join(','));
  sections.push(['Total Daily Reports', filteredReports.length].map(escapeCSVCell).join(','));
  sections.push(''); // Blank line

  // Section 1: Activities
  sections.push(['--- PROJECT ACTIVITIES ---'].map(escapeCSVCell).join(','));
  const activityHeaders = [
    'Activity ID', 'Activity Name', 'Project ID', 'Project Name', 'Work Package', 
    'Discipline', 'Area / Location', 'Priority', 'Status', 'Progress (%)', 
    'Assigned To', 'Supervisor', 'Start Date', 'Finish Date', 'Target Qty', 
    'Actual Qty', 'Unit', 'Planned Hours', 'Actual Hours', 'Description', 'Remarks'
  ];
  sections.push(activityHeaders.map(escapeCSVCell).join(','));

  filteredActivities.forEach(act => {
    const row = [
      act.id, act.name, act.projectId || '', (projects.find(p => p.id === act.projectId)?.name || act.projectId || ''),
      act.workPackage || '', act.discipline || '', act.location || '',
      act.priority || 'Medium', act.status || 'Not Started', act.progress ?? 0,
      act.assignedTo || '', act.supervisor || '', act.startDate || '',
      act.endDate || '', act.targetQuantity ?? 0, act.quantity ?? 0,
      act.unit || '', act.plannedHours ?? 0, act.actualHours ?? 0,
      act.description || '', act.remarks || ''
    ];
    sections.push(row.map(escapeCSVCell).join(','));
  });

  sections.push(''); // Blank line

  // Section 2: Daily Reports
  sections.push(['--- DAILY SITE REPORTS ---'].map(escapeCSVCell).join(','));
  const reportHeaders = [
    'Report ID', 'Date', 'Project ID', 'Project Name', 'Weather', 
    'Temperature', 'Site Conditions', 'Workers On Site', 'Equipment Running', 
    'Incidents', 'NCR Count', 'Significant Events', 'Supervisor Notes'
  ];
  sections.push(reportHeaders.map(escapeCSVCell).join(','));

  filteredReports.forEach(rpt => {
    const row = [
      rpt.id, rpt.date, rpt.projectId, (projects.find(p => p.id === rpt.projectId)?.name || rpt.projectId || ''),
      rpt.weather || '', rpt.temperature || '', rpt.siteConditions || '',
      rpt.workersOnSite ?? 0, rpt.equipmentRunning ?? 0, rpt.incidents ?? 0,
      rpt.ncr ?? 0, rpt.significantEvents || '', rpt.supervisorNotes || ''
    ];
    sections.push(row.map(escapeCSVCell).join(','));
  });

  const fullCSVString = sections.join('\r\n');
  const filename = `constructfield_full_export_${selectedProjectId || 'all'}_${dateStr}.csv`;
  
  downloadCSVFile(filename, fullCSVString);
}

/**
 * Export full project dataset to CSV format
 */
export function exportFullProjectCSV(
  activities: Activity[],
  reports: DailyReport[],
  projects: Project[],
  selectedProjectId?: string
) {
  exportComprehensiveSiteCSV(projects, activities, [], reports, selectedProjectId);
}

/**
 * Export Document Register & Drawing Transmittals to Excel-ready CSV format
 */
export function exportDocumentsToCSV(documents: DocumentItem[], projects?: Project[], filenameSuffix?: string) {
  const headers = [
    'Document ID',
    'Title',
    'File Name',
    'Format Type',
    'File Extension',
    'File Size',
    'Category',
    'Version',
    'Status',
    'Assigned Activity ID',
    'Assigned Activity Name',
    'Uploaded By',
    'Upload Date',
    'Last Modified Date',
    'Tags',
    'Confidential',
    'Description'
  ];

  const rows = documents.map(d => {
    const uploadDateStr = d.uploadedAt ? new Date(d.uploadedAt).toISOString().split('T')[0] : '';
    const modifiedDateStr = d.lastModified ? new Date(d.lastModified).toISOString().split('T')[0] : '';
    const tagsStr = (d.tags || []).join('; ');

    return [
      d.id,
      d.title,
      d.fileName,
      d.fileType,
      d.extension,
      d.fileSizeFormatted,
      d.category,
      d.version,
      d.status,
      d.linkedActivityId || '',
      d.linkedActivityName || '',
      d.uploadedBy,
      uploadDateStr,
      modifiedDateStr,
      tagsStr,
      d.confidential ? 'YES' : 'NO',
      d.description || ''
    ];
  });

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_document_register_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}


/**
 * Export Material Requests to CSV format
 */
export function exportMaterialRequestsToCSV(requests: any[], filenameSuffix?: string) {
  const headers = [
    'Request ID',
    'Material Name / Spec',
    'Quantity',
    'Unit',
    'Requested By',
    'Date Requested',
    'Status',
    'Estimated Unit Price',
    'Recommended Supplier',
    'Additional Notes'
  ];

  const rows = requests.map(req => [
    req.id,
    req.material,
    req.quantity,
    req.unit,
    req.requestedBy,
    req.date,
    req.status,
    req.price || '',
    req.supplier || '',
    req.notes || ''
  ]);

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_material_requests_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

/**
 * Export All Accommodation Facilities to Excel-ready CSV format
 */
export function exportAccommodationsToExcel(
  accommodations: AccommodationUnit[], 
  employees: Employee[], 
  utilities: AccommodationUtilityLog[],
  filenameSuffix?: string
) {
  const headers = [
    'Facility ID',
    'Facility Name',
    'Ownership',
    'Structure Type',
    'Location',
    'Physical Address',
    'Total Rooms',
    'Beds per Room',
    'Total Bed Capacity',
    'Occupied Beds',
    'Vacant Beds',
    'Occupancy Rate',
    'Status',
    'Linked Project',
    'Landlord / Vendor',
    'Lease Agreement #',
    'Pricing Model',
    'Active Monthly Lease (ZAR)',
    'Rate Description',
    'Lease Start Date',
    'Lease End Date',
    'Deposit Paid (ZAR)',
    'Utilities Incurred (ZAR)',
    'Total Monthly Cost (ZAR)',
    'Contact Person',
    'Contact Phone',
    'Amenities'
  ];

  const rows = accommodations.map(unit => {
    const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
    const occupiedCount = occupants.length;
    const vacantCount = Math.max(0, unit.totalCapacityBeds - occupiedCount);
    const occupancyRate = unit.totalCapacityBeds > 0 ? `${Math.round((occupiedCount / unit.totalCapacityBeds) * 100)}%` : '0%';
    const activeLease = calculateAccommodationMonthlyCost(unit);
    const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
    const totalUtils = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
    const totalCost = activeLease + totalUtils;

    return [
      unit.id,
      unit.name,
      unit.ownership,
      unit.type,
      unit.location,
      unit.address || '',
      unit.totalRooms || 1,
      unit.bedsPerRoom || 1,
      unit.totalCapacityBeds,
      occupiedCount,
      vacantCount,
      occupancyRate,
      unit.status,
      unit.projectName || '',
      unit.rentalVendor || '',
      unit.rentalAgreementNumber || '',
      unit.rentalRateType || (unit.ownership === 'Rented' ? 'Fixed Monthly' : 'N/A'),
      activeLease,
      getAccommodationRateDescription(unit),
      unit.rentalStartDate || '',
      unit.rentalEndDate || '',
      unit.rentalDepositPaid || 0,
      totalUtils,
      totalCost,
      unit.contactPerson || '',
      unit.contactPhone || '',
      (unit.amenities || []).join('; ')
    ];
  });

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructfield_accommodations_master_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;

  downloadCSVFile(filename, csvString);
}

/**
 * Export a Single Accommodation Facility (with Resident Roster & Utilities) to Excel-ready CSV format
 */
export function exportSingleAccommodationToExcel(
  unit: AccommodationUnit,
  employees: Employee[],
  utilities: AccommodationUtilityLog[]
) {
  const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
  const activeLease = calculateAccommodationMonthlyCost(unit);
  const totalUtils = utilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
  const totalFacilityCost = activeLease + totalUtils;

  const lines: string[] = [];

  // Section 1: Executive Summary
  lines.push(escapeCSVCell(`CONSTRUCTFIELD ACCOMMODATION FACILITY REPORT: ${unit.name.toUpperCase()}`));
  lines.push([escapeCSVCell('Generated Date'), escapeCSVCell(new Date().toLocaleDateString())].join(','));
  lines.push([escapeCSVCell('Facility ID'), escapeCSVCell(unit.id), escapeCSVCell('Ownership'), escapeCSVCell(unit.ownership)].join(','));
  lines.push([escapeCSVCell('Structure Type'), escapeCSVCell(unit.type), escapeCSVCell('Location'), escapeCSVCell(unit.location)].join(','));
  lines.push([escapeCSVCell('Physical Address'), escapeCSVCell(unit.address || 'N/A'), escapeCSVCell('Linked Project'), escapeCSVCell(unit.projectName || 'General Site')].join(','));
  lines.push([escapeCSVCell('Total Rooms'), escapeCSVCell(unit.totalRooms || 1), escapeCSVCell('Total Beds'), escapeCSVCell(unit.totalCapacityBeds)].join(','));
  lines.push([escapeCSVCell('Occupied Beds'), escapeCSVCell(occupants.length), escapeCSVCell('Vacant Beds'), escapeCSVCell(Math.max(0, unit.totalCapacityBeds - occupants.length))].join(','));
  lines.push([escapeCSVCell('Active Monthly Lease (ZAR)'), escapeCSVCell(activeLease), escapeCSVCell('Rate Terms'), escapeCSVCell(getAccommodationRateDescription(unit))].join(','));
  lines.push([escapeCSVCell('Utilities Incurred (ZAR)'), escapeCSVCell(totalUtils), escapeCSVCell('Total Monthly Cost (ZAR)'), escapeCSVCell(totalFacilityCost)].join(','));
  lines.push('');

  // Section 2: Resident Personnel Roster
  lines.push(escapeCSVCell('--- RESIDENT PERSONNEL ROSTER ---'));
  lines.push(['Employee ID', 'Full Name', 'Position / Role', 'Department', 'Room / Bed #', 'Check-In Date', 'Phone Number'].map(escapeCSVCell).join(','));
  if (occupants.length === 0) {
    lines.push(escapeCSVCell('No personnel currently allocated to this facility.'));
  } else {
    occupants.forEach(emp => {
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
      lines.push([
        emp.id,
        fullName,
        emp.position || (emp as any).role || 'Staff',
        emp.department || 'Operations',
        emp.accommodationDetails?.roomNumber || '—',
        emp.accommodationDetails?.checkInDate || unit.createdAt || '—',
        emp.phone || '—'
      ].map(escapeCSVCell).join(','));
    });
  }
  lines.push('');

  // Section 3: Itemized Utility Bills & Expenses
  lines.push(escapeCSVCell('--- UTILITIES & EXPENSES LEDGER ---'));
  lines.push(['Utility ID', 'Date', 'Category', 'Amount (ZAR)', 'Units Consumed', 'Unit Label', 'Vendor / Supplier', 'Receipt / Invoice #', 'Status', 'Notes'].map(escapeCSVCell).join(','));
  if (utilities.length === 0) {
    lines.push(escapeCSVCell('No utility expenses logged for this facility.'));
  } else {
    utilities.forEach(u => {
      lines.push([
        u.id,
        u.date,
        u.utilityType,
        u.amountZAR,
        u.unitsConsumed || '',
        u.unitLabel || '',
        u.vendorOrProvider || '',
        u.invoiceOrReceiptNumber || '',
        u.paidStatus,
        u.notes || ''
      ].map(escapeCSVCell).join(','));
    });
  }

  const csvString = lines.join('\r\n');
  const sanitizedName = unit.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `constructfield_accommodation_${sanitizedName}_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSVFile(filename, csvString);
}
