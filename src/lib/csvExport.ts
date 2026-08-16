import * as XLSX from 'xlsx';
import { Activity, DailyReport, DocumentItem, MaterialInventory, Project, AccommodationUnit, AccommodationUtilityLog, AccommodationPaymentLog, Employee } from '../types';
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
 * Export All Accommodation Facilities to a Multi-Sheet Excel (.xlsx) Workbook
 */
export function exportAccommodationsToExcel(
  accommodations: AccommodationUnit[], 
  employees: Employee[], 
  utilities: AccommodationUtilityLog[],
  payments: AccommodationPaymentLog[] = [],
  filenameSuffix?: string
) {
  const wb = XLSX.utils.book_new();

  // TAB 1: Facilities Portfolio Master
  const portfolioData = accommodations.map((unit, index) => {
    const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
    const occupiedCount = occupants.length;
    const vacantCount = Math.max(0, unit.totalCapacityBeds - occupiedCount);
    const occupancyRate = unit.totalCapacityBeds > 0 ? `${Math.round((occupiedCount / unit.totalCapacityBeds) * 100)}%` : '0%';
    const activeLease = calculateAccommodationMonthlyCost(unit);
    const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
    const totalUtils = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
    const totalCost = activeLease + totalUtils;

    return {
      'No.': index + 1,
      'Facility ID': unit.id,
      'Facility Name': unit.name,
      'Ownership': unit.ownership,
      'Structure Type': unit.type,
      'Location': unit.location,
      'Physical Address': unit.address || '—',
      'Linked Project': unit.projectName || '—',
      'Total Rooms': unit.totalRooms || 1,
      'Beds per Room': unit.bedsPerRoom || 1,
      'Total Beds': unit.totalCapacityBeds,
      'Occupied Beds': occupiedCount,
      'Vacant Beds': vacantCount,
      'Occupancy Rate': occupancyRate,
      'Pricing Model': unit.rentalRateType || (unit.ownership === 'Rented' ? 'Fixed Monthly' : 'N/A'),
      'Rate per Person/Room (ZAR)': unit.rentalRatePerUnit || unit.rentalMonthlyCost || 0,
      'Active Monthly Lease (ZAR)': activeLease,
      'Rate Description': getAccommodationRateDescription(unit),
      'Utilities Incurred (ZAR)': totalUtils,
      'Total Monthly Cost (ZAR)': totalCost,
      'Landlord / Vendor': unit.rentalVendor || '—',
      'Agreement / PO #': unit.rentalAgreementNumber || '—',
      'Lease Start Date': unit.rentalStartDate || '—',
      'Lease End Date': unit.rentalEndDate || '—',
      'Deposit Paid (ZAR)': unit.rentalDepositPaid || 0,
      'Status': unit.status,
      'Contact Person': unit.contactPerson || '—',
      'Contact Phone': unit.contactPhone || '—',
      'Amenities': (unit.amenities || []).join('; ')
    };
  });
  const wsPortfolio = XLSX.utils.json_to_sheet(portfolioData);
  wsPortfolio['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 28 }, { wch: 20 },
    { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 22 },
    { wch: 24 }, { wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
    { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPortfolio, 'Facilities Portfolio');

  // TAB 2: Staff Housing Directory (All Resident Workers)
  const rosterRows: any[] = [];
  let rIndex = 1;
  accommodations.forEach(acc => {
    acc.occupantIds.forEach(empId => {
      const emp = employees.find(e => e.id === empId);
      if (emp) {
        const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
        rosterRows.push({
          'No.': rIndex++,
          'Employee ID': emp.id,
          'Full Name': fullName,
          'Position / Role': emp.position || (emp as any).role || 'Staff',
          'Department': emp.department || 'Operations',
          'Facility ID': acc.id,
          'Facility Name': acc.name,
          'Ownership': acc.ownership,
          'Room / Bed #': emp.accommodationDetails?.roomNumber || '—',
          'Check-in Date': emp.accommodationDetails?.checkInDate || acc.createdAt || '—',
          'Phone Number': emp.phone || '—'
        });
      }
    });
  });
  const wsRoster = XLSX.utils.json_to_sheet(rosterRows.length > 0 ? rosterRows : [{ 'Notice': 'No workers currently housed.' }]);
  wsRoster['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 14 }, { wch: 15 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Staff Housing Roster');

  // TAB 3: Utilities & Running Costs Ledger
  const utilitiesData = utilities.map((u, idx) => ({
    'No.': idx + 1,
    'Utility ID': u.id,
    'Facility ID': u.accommodationId,
    'Facility Name': u.accommodationName,
    'Date Logged': u.date,
    'Expense Category': u.utilityType,
    'Amount (ZAR)': u.amountZAR,
    'Units Consumed': u.unitsConsumed || 0,
    'Unit Type': u.unitLabel || 'units',
    'Supplier / Vendor': u.vendorOrProvider || '—',
    'Invoice / Voucher #': u.invoiceOrReceiptNumber || '—',
    'Status': u.paidStatus,
    'Logged By': u.loggedBy,
    'Notes': u.notes || ''
  }));
  const wsUtilities = XLSX.utils.json_to_sheet(utilitiesData.length > 0 ? utilitiesData : [{ 'Notice': 'No utility records found.' }]);
  wsUtilities['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsUtilities, 'Utilities Ledger');

  // TAB 4: Lease Payments Tracking
  const paymentsData = payments.map((p, idx) => ({
    'No.': idx + 1,
    'Payment ID': p.id,
    'Facility ID': p.accommodationId,
    'Facility Name': p.accommodationName,
    'Payment Date': p.paymentDate,
    'Billing Period': p.billingPeriod,
    'Resident Occupants': p.occupantCount,
    'Total Lease Due (ZAR)': p.amountDueZAR,
    'Amount Paid (ZAR)': p.amountPaidZAR,
    'Payment Method': p.paymentMethod,
    'Reference / EFT #': p.referenceNumber || '—',
    'Paid To (Vendor)': p.paidToVendor || '—',
    'Status': p.status,
    'Logged By': p.loggedBy || 'System',
    'Notes': p.notes || ''
  }));
  const wsPayments = XLSX.utils.json_to_sheet(paymentsData.length > 0 ? paymentsData : [{ 'Notice': 'No lease payments logged yet.' }]);
  wsPayments['!cols'] = [
    { wch: 6 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Lease Payments Tracking');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Constructfield_Accommodations_Master_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export a Single Accommodation Facility (with separate sheets for Monthly Lease, Resident Roster, Utilities, and Payments) to formatted Excel (.xlsx)
 */
export function exportSingleAccommodationToExcel(
  unit: AccommodationUnit,
  employees: Employee[],
  utilities: AccommodationUtilityLog[],
  payments: AccommodationPaymentLog[] = []
) {
  const wb = XLSX.utils.book_new();
  const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
  const activeLease = calculateAccommodationMonthlyCost(unit);
  const totalUtils = utilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
  const totalFacilityCost = activeLease + totalUtils;

  // TAB 1: Monthly Lease & Facility Summary
  const summaryData = [
    { 'Parameter': 'Facility Name', 'Value': unit.name },
    { 'Parameter': 'Facility ID', 'Value': unit.id },
    { 'Parameter': 'Ownership Model', 'Value': unit.ownership },
    { 'Parameter': 'Structure / Accommodation Type', 'Value': unit.type },
    { 'Parameter': 'Facility Status', 'Value': unit.status },
    { 'Parameter': 'Location', 'Value': unit.location },
    { 'Parameter': 'Physical Address', 'Value': unit.address || 'N/A' },
    { 'Parameter': 'Linked Project', 'Value': unit.projectName || 'General Site' },
    { 'Parameter': 'Total Rooms', 'Value': unit.totalRooms || 1 },
    { 'Parameter': 'Beds per Room', 'Value': unit.bedsPerRoom || 1 },
    { 'Parameter': 'Total Bed Capacity', 'Value': unit.totalCapacityBeds },
    { 'Parameter': 'Active Resident Occupants', 'Value': occupants.length },
    { 'Parameter': 'Vacant Beds Available', 'Value': Math.max(0, unit.totalCapacityBeds - occupants.length) },
    { 'Parameter': 'Occupancy Rate', 'Value': unit.totalCapacityBeds > 0 ? `${Math.round((occupants.length / unit.totalCapacityBeds) * 100)}%` : '0%' },
    { 'Parameter': 'Rental Pricing Model', 'Value': unit.rentalRateType || (unit.ownership === 'Rented' ? 'Fixed Monthly' : 'N/A') },
    { 'Parameter': 'Rental Rate per Unit / Person', 'Value': unit.rentalRatePerUnit || unit.rentalMonthlyCost || 0 },
    { 'Parameter': 'Calculated Monthly Lease Incurred (ZAR)', 'Value': activeLease },
    { 'Parameter': 'Rate Terms Description', 'Value': getAccommodationRateDescription(unit) },
    { 'Parameter': 'Landlord / Vendor', 'Value': unit.rentalVendor || 'N/A' },
    { 'Parameter': 'Lease Agreement / PO #', 'Value': unit.rentalAgreementNumber || 'N/A' },
    { 'Parameter': 'Lease Start Date', 'Value': unit.rentalStartDate || 'N/A' },
    { 'Parameter': 'Lease End Date', 'Value': unit.rentalEndDate || 'N/A' },
    { 'Parameter': 'Security Deposit Paid (ZAR)', 'Value': unit.rentalDepositPaid || 0 },
    { 'Parameter': 'Total Utilities Incurred (ZAR)', 'Value': totalUtils },
    { 'Parameter': 'Total Monthly Facility Cost (ZAR)', 'Value': totalFacilityCost },
    { 'Parameter': 'Contact Person', 'Value': unit.contactPerson || 'N/A' },
    { 'Parameter': 'Contact Phone', 'Value': unit.contactPhone || 'N/A' },
    { 'Parameter': 'Amenities', 'Value': (unit.amenities || []).join(', ') || 'Standard' },
    { 'Parameter': 'Access / Gate Notes', 'Value': unit.notes || 'None' },
    { 'Parameter': 'Report Generated Date', 'Value': new Date().toISOString().split('T')[0] }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 42 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Monthly Lease & Summary');

  // TAB 2: Resident Personnel Roster
  const rosterData = occupants.length > 0 ? occupants.map((emp, index) => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
    return {
      'No.': index + 1,
      'Employee ID': emp.id,
      'Full Name': fullName,
      'Position / Role': emp.position || (emp as any).role || 'Staff',
      'Department': emp.department || 'Operations',
      'Room / Bed #': emp.accommodationDetails?.roomNumber || '—',
      'Check-in Date': emp.accommodationDetails?.checkInDate || unit.createdAt || '—',
      'Contact Phone': emp.phone || '—',
      'Status': emp.status || 'Active'
    };
  }) : [{ 'Notice': 'No resident workers currently allocated to this facility.' }];
  const wsRoster = XLSX.utils.json_to_sheet(rosterData);
  wsRoster['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Resident Roster');

  // TAB 3: Utilities & Running Costs
  const utilitiesData = utilities.length > 0 ? utilities.map((u, index) => ({
    'No.': index + 1,
    'Utility ID': u.id,
    'Date Logged': u.date,
    'Expense Category': u.utilityType,
    'Amount (ZAR)': u.amountZAR,
    'Units Consumed': u.unitsConsumed || 0,
    'Unit Type': u.unitLabel || 'units',
    'Supplier / Vendor': u.vendorOrProvider || '—',
    'Invoice / Voucher #': u.invoiceOrReceiptNumber || '—',
    'Payment Status': u.paidStatus,
    'Logged By': u.loggedBy,
    'Notes / Remarks': u.notes || ''
  })) : [{ 'Notice': 'No utility or running bills logged for this facility.' }];
  const wsUtilities = XLSX.utils.json_to_sheet(utilitiesData);
  wsUtilities['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 14 }, { wch: 28 }, { wch: 15 }, { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsUtilities, 'Utilities & Running Bills');

  // TAB 4: Lease Payment Tracking Ledger
  const facilityPayments = payments.filter(p => p.accommodationId === unit.id);
  const paymentData = facilityPayments.length > 0 ? facilityPayments.map((p, index) => ({
    'No.': index + 1,
    'Payment ID': p.id,
    'Payment Date': p.paymentDate,
    'Billing Period': p.billingPeriod,
    'Resident Occupants Count': p.occupantCount,
    'Total Lease Due (ZAR)': p.amountDueZAR,
    'Amount Paid (ZAR)': p.amountPaidZAR,
    'Payment Method': p.paymentMethod,
    'Reference / EFT #': p.referenceNumber || '—',
    'Paid To (Vendor)': p.paidToVendor || '—',
    'Status': p.status,
    'Logged By': p.loggedBy || 'System',
    'Notes': p.notes || ''
  })) : [{ 'Notice': 'No lease payments logged for this facility yet.' }];
  const wsPayments = XLSX.utils.json_to_sheet(paymentData);
  wsPayments['!cols'] = [{ wch: 6 }, { wch: 15 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 12 }, { wch: 16 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Lease Payments Tracking');

  const sanitizedName = unit.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Constructfield_Accommodation_${sanitizedName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
