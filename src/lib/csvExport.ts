import { Activity, DailyReport, DocumentItem, MaterialInventory, Project } from '../types';

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
  const filename = `constructos_materials_inventory_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
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
    'Work Package',
    'Discipline',
    'Area / Location',
    'Priority',
    'Status',
    'Progress (%)',
    'Assigned To',
    'Supervisor',
    'Start Date',
    'Finish Date',
    'Created Date',
    'Last Updated Date',
    'Target Quantity',
    'Actual Quantity',
    'Unit',
    'Planned Hours',
    'Actual Hours',
    'Description',
    'Remarks'
  ];

  const rows = activities.map(act => [
    act.id,
    act.name,
    act.projectId,
    getProjectName(act.projectId),
    act.workPackage || '',
    act.discipline || '',
    act.area || act.location || '',
    act.priority || 'Medium',
    act.status || 'Not Started',
    act.progress ?? 0,
    act.assignedTo || '',
    act.supervisor || '',
    act.startDate || '',
    act.finishDate || '',
    act.createdAt || act.startDate || '',
    act.updatedAt || act.createdAt || act.startDate || '',
    act.targetQuantity ?? 0,
    act.actualQuantity ?? 0,
    act.unit || '',
    act.plannedHours ?? 0,
    act.actualHours ?? 0,
    act.description || '',
    act.remarks || ''
  ]);

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructos_activities_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

/**
 * Export Daily Reports to CSV format
 */
export function exportReportsToCSV(reports: DailyReport[], projects: Project[], filenameSuffix?: string) {
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : projId;
  };

  const headers = [
    'Report ID',
    'Date',
    'Project ID',
    'Project Name',
    'Weather',
    'Temperature',
    'Site Conditions',
    'Workers On Site',
    'Equipment Running',
    'Incidents',
    'NCR Count',
    'Significant Events',
    'Supervisor Notes'
  ];

  const rows = reports.map(rpt => [
    rpt.id,
    rpt.date,
    rpt.projectId,
    getProjectName(rpt.projectId),
    rpt.weather || '',
    rpt.temperature || '',
    rpt.siteConditions || '',
    rpt.workersOnSite ?? 0,
    rpt.equipmentRunning ?? 0,
    rpt.incidents ?? 0,
    rpt.ncr ?? 0,
    rpt.significantEvents || '',
    rpt.supervisorNotes || ''
  ]);

  const csvRows = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ];

  const csvString = csvRows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `constructos_daily_reports_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}

/**
 * Export full project dataset (Activities + Reports) into a multi-section CSV file
 */
export function exportFullProjectCSV(activities: Activity[], reports: DailyReport[], projects: Project[], selectedProjectId?: string) {
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : projId;
  };

  const targetActivities = selectedProjectId 
    ? activities.filter(a => a.projectId === selectedProjectId)
    : activities;
    
  const targetReports = selectedProjectId 
    ? reports.filter(r => r.projectId === selectedProjectId)
    : reports;

  const sections: string[] = [];

  // Summary Metadata
  const dateStr = new Date().toISOString().split('T')[0];
  const projName = selectedProjectId ? getProjectName(selectedProjectId) : 'All Projects';
  
  sections.push(['CONSTRUCTOS SITE EXPORT SUMMARY'].map(escapeCSVCell).join(','));
  sections.push(['Export Date', dateStr].map(escapeCSVCell).join(','));
  sections.push(['Project Scope', projName].map(escapeCSVCell).join(','));
  sections.push(['Total Activities', targetActivities.length].map(escapeCSVCell).join(','));
  sections.push(['Total Daily Reports', targetReports.length].map(escapeCSVCell).join(','));
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

  targetActivities.forEach(act => {
    const row = [
      act.id, act.name, act.projectId, getProjectName(act.projectId),
      act.workPackage || '', act.discipline || '', act.area || act.location || '',
      act.priority || 'Medium', act.status || 'Not Started', act.progress ?? 0,
      act.assignedTo || '', act.supervisor || '', act.startDate || '',
      act.finishDate || '', act.targetQuantity ?? 0, act.actualQuantity ?? 0,
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

  targetReports.forEach(rpt => {
    const row = [
      rpt.id, rpt.date, rpt.projectId, getProjectName(rpt.projectId),
      rpt.weather || '', rpt.temperature || '', rpt.siteConditions || '',
      rpt.workersOnSite ?? 0, rpt.equipmentRunning ?? 0, rpt.incidents ?? 0,
      rpt.ncr ?? 0, rpt.significantEvents || '', rpt.supervisorNotes || ''
    ];
    sections.push(row.map(escapeCSVCell).join(','));
  });

  const fullCSVString = sections.join('\r\n');
  const filename = `constructos_full_export_${selectedProjectId || 'all'}_${dateStr}.csv`;
  
  downloadCSVFile(filename, fullCSVString);
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
      d.fileType.toUpperCase(),
      d.fileExtension.toUpperCase(),
      d.fileSizeFormatted || `${d.fileSize} B`,
      d.category,
      d.version,
      d.status,
      d.linkedActivityId || 'None',
      d.linkedActivityName || 'Unassigned',
      d.uploadedBy,
      uploadDateStr,
      modifiedDateStr,
      tagsStr,
      d.confidential ? 'Yes' : 'No',
      d.description || ''
    ];
  });

  const csvContent = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map(row => row.map(escapeCSVCell).join(','))
  ].join('\r\n');

  const dateStr = new Date().toISOString().split('T')[0];
  const suffix = filenameSuffix ? `_${filenameSuffix}` : '';
  const filename = `constructos_document_register${suffix}_${dateStr}.csv`;

  downloadCSVFile(filename, csvContent);
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
  const filename = `constructos_material_requests_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.csv`;
  
  downloadCSVFile(filename, csvString);
}
