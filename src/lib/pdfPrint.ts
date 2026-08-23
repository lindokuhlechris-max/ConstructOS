import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Activity, DocumentItem, MaterialInventory, Project, AuditLog, QAInspectionItem } from '../types';
import { saveOrShareFile } from './fileExportService';

export interface PrintActivityAuditOptions {
  project?: Project;
  logs: AuditLog[];
  filterLabel?: string;
  totalLogsCount?: number;
  activityName?: string;
}

interface PrintSummaryOptions {
  project?: Project;
  activities: Activity[];
  filterLabel?: string;
  totalActivitiesCount?: number;
}

interface PrintMaterialsOptions {
  project?: Project;
  materials: MaterialInventory[];
  filterLabel?: string;
  totalMaterialsCount?: number;
}

interface PrintDocumentsOptions {
  project?: Project;
  documents: DocumentItem[];
  filterLabel?: string;
  totalDocumentsCount?: number;
}

/**
 * Generates an executive, beautifully formatted PDF document of activities
 * and exports/shares it seamlessly across Desktop, PWA, and Android APK (Capacitor).
 */
export async function printActivitiesSummary({
  project,
  activities,
  filterLabel = 'All Activities',
  totalActivitiesCount,
}: PrintSummaryOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate metrics
    const total = activities.length;
    const inProgress = activities.filter(a => a.status === 'In Progress').length;
    const completed = activities.filter(a => a.status === 'Completed').length;
    const blocked = activities.filter(a => a.status === 'Blocked' || a.status === 'Waiting' || a.status === 'Cancelled').length;
    const notStarted = activities.filter(a => a.status === 'Not Started' || a.status === 'Ready').length;
    const avgProgress = total > 0 
      ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / total) 
      : 0;

    // Header Background Accent (#0B5FFF)
    doc.setFillColor(11, 95, 255);
    doc.rect(0, 0, 842, 48, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SCEDIH — Activities Summary Report', 36, 30);

    // Subheader metadata
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project?.name || 'Main Construction Site'}  •  Location: ${project?.location || 'Jobsite'}  •  Scope: ${filterLabel}`, 36, 68);
    doc.text(`Generated on: ${currentDate} at ${currentTime}  •  Showing ${total} of ${totalActivitiesCount ?? total} activities`, 36, 82);

    // Summary KPI Cards Box
    const startY = 96;
    const cardWidth = 120;
    const cardHeight = 36;
    const cards = [
      { label: 'TOTAL SELECTED', val: `${total}`, color: [11, 95, 255] },
      { label: 'IN PROGRESS', val: `${inProgress}`, color: [37, 99, 235] },
      { label: 'COMPLETED', val: `${completed}`, color: [5, 150, 105] },
      { label: 'BLOCKED / DELAYED', val: `${blocked}`, color: [220, 38, 38] },
      { label: 'NOT STARTED', val: `${notStarted}`, color: [217, 119, 6] },
      { label: 'AVG. PROGRESS', val: `${avgProgress}%`, color: [79, 70, 229] },
    ];

    cards.forEach((c, i) => {
      const x = 36 + i * (cardWidth + 10);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, x + 8, startY + 14);

      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, x + 8, startY + 30);
    });

    // AutoTable for Activities
    const tableHeaders = [
      ['ID', 'Activity Name & Scope Details', 'Discipline', 'Priority', 'Qty / Target', 'Status', 'Start Date', 'Progress %']
    ];

    const tableData = activities.map(act => [
      act.id,
      `${act.name}${act.workPackage ? `\nPackage: ${act.workPackage}` : ''}${act.area ? ` | Area: ${act.area}` : ''}`,
      act.discipline || 'General',
      act.priority || 'Medium',
      `${act.actualQuantity || 0} / ${act.targetQuantity || 0} ${act.unit || 'units'}`,
      act.status || 'Not Started',
      act.startDate || '—',
      `${act.progress || 0}%`
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: startY + cardHeight + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { cellWidth: 260 },
        2: { cellWidth: 70 },
        3: { cellWidth: 60 },
        4: { cellWidth: 85 },
        5: { cellWidth: 75 },
        6: { cellWidth: 70 },
        7: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Scedih Enterprise Field Management  •  Page ${data.pageNumber}`,
          36,
          doc.internal.pageSize.getHeight() - 16
        );
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `scedih_activities_summary_${dateStr}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: 'Scedih Activities Summary PDF',
      text: `Scedih Activities Summary Report - ${currentDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating activities PDF:', err);
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
    return false;
  }
}

/**
 * Generates an executive, beautifully formatted PDF report of Material Inventory
 * and exports/shares it across Mobile APK, PWA, and Desktop.
 */
export async function printMaterialsSummary({
  project,
  materials,
  filterLabel = 'All Material Items',
  totalMaterialsCount,
}: PrintMaterialsOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate Materials KPIs
    const total = materials.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalEstimatedUnits = 0;
    let totalReceivedUnits = 0;
    let totalUsedUnits = 0;

    materials.forEach(m => {
      const balance = m.receivedQuantity - m.usedQuantity;
      const thresh = m.reorderLevel !== undefined && m.reorderLevel >= 0 
        ? m.reorderLevel 
        : Math.round((m.estimatedQuantity || 100) * 0.1);
      
      totalEstimatedUnits += m.estimatedQuantity || 0;
      totalReceivedUnits += m.receivedQuantity || 0;
      totalUsedUnits += m.usedQuantity || 0;

      if (balance <= 0) {
        outOfStockCount++;
      } else if (balance <= thresh) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    // Header Background Accent (#0B5FFF)
    doc.setFillColor(11, 95, 255);
    doc.rect(0, 0, 842, 48, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SCEDIH — Material Inventory & Reorder Report', 36, 30);

    // Subheader
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project?.name || 'Main Construction Site'}  •  Scope: ${filterLabel}`, 36, 68);
    doc.text(`Report Date: ${currentDate} at ${currentTime}  •  Listed Materials: ${total} of ${totalMaterialsCount ?? total} items`, 36, 82);

    // KPI Cards Box
    const startY = 96;
    const cardWidth = 120;
    const cardHeight = 36;
    const cards = [
      { label: 'TOTAL SKUS', val: `${total}`, color: [11, 95, 255] },
      { label: 'IN STOCK', val: `${inStockCount}`, color: [5, 150, 105] },
      { label: 'BELOW THRESHOLD', val: `${lowStockCount}`, color: [220, 38, 38] },
      { label: 'OUT OF STOCK', val: `${outOfStockCount}`, color: [220, 38, 38] },
      { label: 'TOTAL RECEIVED', val: `${totalReceivedUnits.toLocaleString()}`, color: [37, 99, 235] },
      { label: 'TOTAL USED', val: `${totalUsedUnits.toLocaleString()}`, color: [79, 70, 229] },
    ];

    cards.forEach((c, i) => {
      const x = 36 + i * (cardWidth + 10);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, x + 8, startY + 14);

      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, x + 8, startY + 30);
    });

    // AutoTable for Materials
    const tableHeaders = [
      ['ID / SKU', 'Material Name & Storage Location', 'Category', 'Estimated', 'Min Reorder', 'Received', 'Used', 'Balance', 'Status', 'Usage %']
    ];

    const tableData = materials.map(mat => {
      const balance = mat.receivedQuantity - mat.usedQuantity;
      const threshold = mat.reorderLevel !== undefined && mat.reorderLevel >= 0 
        ? mat.reorderLevel 
        : Math.round((mat.estimatedQuantity || 100) * 0.1);
      const isLow = balance <= threshold;
      const usageRatio = mat.estimatedQuantity > 0 ? Math.min(100, Math.round((mat.usedQuantity / mat.estimatedQuantity) * 100)) : 0;
      let computedStatus = mat.status;
      if (balance <= 0) computedStatus = 'Out of Stock';
      else if (isLow) computedStatus = 'Low Stock';
      else if (mat.usedQuantity > mat.estimatedQuantity) computedStatus = 'Over Estimate';
      else computedStatus = 'In Stock';

      return [
        mat.sku ? `${mat.id}\nSKU: ${mat.sku}` : mat.id,
        `${mat.name}${mat.location ? `\nLoc: ${mat.location}` : ''}`,
        mat.category || 'General',
        `${mat.estimatedQuantity?.toLocaleString() || 0} ${mat.unit || ''}`,
        `${threshold.toLocaleString()} ${mat.unit || ''}`,
        mat.receivedQuantity?.toLocaleString() || '0',
        mat.usedQuantity?.toLocaleString() || '0',
        `${balance.toLocaleString()} ${mat.unit || ''}`,
        computedStatus,
        `${usageRatio}%`
      ];
    });

    const margin = 36;
    const pageHeight = doc.internal.pageSize.getHeight();

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: startY + cardHeight + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 200 },
        2: { cellWidth: 70 },
        3: { cellWidth: 65, halign: 'right' },
        4: { cellWidth: 65, halign: 'right' },
        5: { cellWidth: 60, halign: 'right' },
        6: { cellWidth: 60, halign: 'right' },
        7: { cellWidth: 70, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 65, halign: 'center' },
        9: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Scedih Enterprise Materials Inventory  •  Page ${data.pageNumber}`,
          margin,
          pageHeight - 16
        );
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `scedih_materials_inventory_${dateStr}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: 'Scedih Materials Inventory PDF',
      text: `Scedih Materials Inventory Report - ${currentDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating materials PDF:', err);
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
    return false;
  }
}

/**
 * Generates an executive, beautifully formatted PDF report of Document Register & Drawings Hub
 * and exports/shares it across Mobile APK, PWA, and Desktop.
 */
export async function printDocumentsSummary({
  project,
  documents,
  filterLabel = 'All Project Documents',
  totalDocumentsCount,
}: PrintDocumentsOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate Document KPIs
    const total = documents.length;
    const approvedCount = documents.filter(d => d.status === 'Approved').length;
    const underReviewCount = documents.filter(d => d.status === 'Under Review').length;
    const assignedToActivityCount = documents.filter(d => !!d.linkedActivityId).length;
    const drawingsCount = documents.filter(d => d.category === 'Drawings & Blueprints' || d.fileType === 'cad').length;
    const spreadsheetsCount = documents.filter(d => d.fileType === 'excel').length;

    // Header Background Accent (#0B5FFF)
    doc.setFillColor(11, 95, 255);
    doc.rect(0, 0, 842, 48, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SCEDIH — Document Register & Transmittal Report', 36, 30);

    // Subheader
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project?.name || 'Main Construction Site'}  •  Scope: ${filterLabel}`, 36, 68);
    doc.text(`Report Date: ${currentDate} at ${currentTime}  •  Listed Files: ${total} of ${totalDocumentsCount ?? total} documents`, 36, 82);

    // KPI Cards Box
    const startY = 96;
    const cardWidth = 120;
    const cardHeight = 36;
    const cards = [
      { label: 'TOTAL DOCUMENTS', val: `${total}`, color: [11, 95, 255] },
      { label: 'APPROVED', val: `${approvedCount}`, color: [5, 150, 105] },
      { label: 'UNDER REVIEW', val: `${underReviewCount}`, color: [217, 119, 6] },
      { label: 'ACTIVITY LINKED', val: `${assignedToActivityCount}`, color: [37, 99, 235] },
      { label: 'DRAWINGS & CAD', val: `${drawingsCount}`, color: [234, 88, 12] },
      { label: 'SPREADSHEETS', val: `${spreadsheetsCount}`, color: [5, 150, 105] },
    ];

    cards.forEach((c, i) => {
      const x = 36 + i * (cardWidth + 10);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, x + 8, startY + 14);

      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, x + 8, startY + 30);
    });

    // AutoTable for Documents
    const tableHeaders = [
      ['Doc ID', 'Document Title & File', 'Format', 'Category', 'Assigned Activity', 'Status', 'Uploaded By']
    ];

    const tableData = documents.map(d => [
      d.id,
      `${d.title}\n${d.fileName || ''} (${d.fileSizeFormatted || ''})`,
      d.fileExtension?.toUpperCase() || 'FILE',
      d.category || 'General',
      d.linkedActivityName ? `${d.linkedActivityName}\nID: ${d.linkedActivityId}` : 'Unassigned',
      d.status || 'Draft',
      `${d.uploadedBy || 'System'}\n${d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('en-GB') : '-'}`
    ]);

    const margin = 36;
    const pageHeight = doc.internal.pageSize.getHeight();

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: startY + cardHeight + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 240 },
        2: { cellWidth: 55, halign: 'center' },
        3: { cellWidth: 120 },
        4: { cellWidth: 140 },
        5: { cellWidth: 75, halign: 'center' },
        6: { cellWidth: 80 },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Scedih Enterprise Document Management  •  Page ${data.pageNumber}`,
          margin,
          pageHeight - 16
        );
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `scedih_documents_register_${dateStr}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: 'Scedih Documents Register PDF',
      text: `Scedih Documents Register Report - ${currentDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating documents PDF:', err);
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
    return false;
  }
}

/**
 * Generates an executive, beautifully formatted PDF document
 * for the Activity & Subtask Audit Ledger across Mobile APK, PWA, and Desktop.
 */
export async function printActivityAuditSummary({
  project,
  logs,
  filterLabel = 'All Events',
  totalLogsCount,
  activityName,
}: PrintActivityAuditOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate metrics
    const total = logs.length;
    const subtaskEvents = logs.filter(l => 
      l.action.toLowerCase().includes('subtask') || l.details.toLowerCase().includes('subtask')
    ).length;
    const qaApprovals = logs.filter(l => 
      l.action.toLowerCase().includes('qa') || l.details.toLowerCase().includes('qa hold point') || l.details.toLowerCase().includes('qa inspection')
    ).length;
    const progressLogs = logs.filter(l => 
      l.action.toLowerCase().includes('progress') || l.details.toLowerCase().includes('progress logged')
    ).length;
    const deletions = logs.filter(l => 
      l.actionType === 'delete' || l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove')
    ).length;

    // Header Background Accent (#0B5FFF)
    doc.setFillColor(11, 95, 255);
    doc.rect(0, 0, 842, 48, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('SCEDIH — Activity Audit Trail & Compliance Ledger', 36, 30);

    // Subheader
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project?.name || 'Main Site'}${activityName ? `  •  Activity: ${activityName}` : ''}  •  Scope: ${filterLabel}`, 36, 68);
    doc.text(`Generated: ${currentDate} at ${currentTime}  •  Showing ${total} of ${totalLogsCount ?? total} audit records`, 36, 82);

    // KPI Cards Box
    const startY = 96;
    const cardWidth = 145;
    const cardHeight = 36;
    const cards = [
      { label: 'TOTAL AUDIT EVENTS', val: `${total}`, color: [11, 95, 255] },
      { label: 'SUBTASK UPDATES', val: `${subtaskEvents}`, color: [5, 150, 105] },
      { label: 'QA INSPECTIONS', val: `${qaApprovals}`, color: [79, 70, 229] },
      { label: 'PROGRESS LOGS', val: `${progressLogs}`, color: [37, 99, 235] },
      { label: 'RECORD DELETIONS', val: `${deletions}`, color: [220, 38, 38] },
    ];

    cards.forEach((c, i) => {
      const x = 36 + i * (cardWidth + 10);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, x + 8, startY + 14);

      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, x + 8, startY + 30);
    });

    // AutoTable for Audit Logs
    const tableHeaders = [
      ['Date & Time', 'Action Type', 'Activity / Scope', 'Details & State Mutations', 'User / Role', 'Audit ID']
    ];

    const tableData = logs.map(l => [
      l.timestamp ? new Date(l.timestamp).toLocaleString('en-GB') : '-',
      l.action || 'System Event',
      l.activityName || l.activityId || '-',
      l.details || '-',
      `${l.userId || 'User'} (${l.userRole || 'Field'})`,
      l.id || '-'
    ]);

    const margin = 36;
    const pageHeight = doc.internal.pageSize.getHeight();

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: startY + cardHeight + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [71, 85, 105],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        cellPadding: 5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 100, fontStyle: 'bold' },
        2: { cellWidth: 130 },
        3: { cellWidth: 260 },
        4: { cellWidth: 100 },
        5: { cellWidth: 80, fontStyle: 'bold' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Scedih Enterprise Field Governance & Audit Trail  •  Page ${data.pageNumber}`,
          margin,
          pageHeight - 16
        );
      }
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `scedih_activity_audit_trail_${dateStr}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: 'Scedih Activity Audit Trail PDF',
      text: `Scedih Activity Audit Trail Report - ${currentDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating audit PDF:', err);
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
    return false;
  }
}

export interface PrintQAInspectionsOptions {
  project?: Project;
  inspections: QAInspectionItem[];
  filterLabel?: string;
  totalCount?: number;
  orientation?: 'landscape' | 'portrait';
  includeSignoffs?: boolean;
}

/**
 * Generates an executive, beautifully formatted PDF document for QA/QC Inspections & ITR register
 * across Mobile APK, PWA, and Desktop.
 */
export async function printQAInspectionRegisterSummary({
  project,
  inspections,
  filterLabel = 'All QA/QC Inspections',
  totalCount,
  orientation = 'landscape',
  includeSignoffs = true,
}: PrintQAInspectionsOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4',
    });

    const isLandscape = orientation === 'landscape';
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;

    const currentDate = new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Metrics calculation
    const total = inspections.length;
    const passedCount = inspections.filter(i => i.status === 'Passed').length;
    const failedCount = inspections.filter(i => i.status === 'Failed').length;
    const inReviewCount = inspections.filter(i => i.status === 'Pending Approval').length;
    
    let totalTarget = 0;
    let totalApproved = 0;
    inspections.forEach(i => {
      totalTarget += (i.targetQuantity || 0);
      totalApproved += (i.approvedQuantity || 0);
    });
    const overallRate = totalTarget > 0 ? Math.round((totalApproved / totalTarget) * 100) : (total > 0 ? Math.round((passedCount / total) * 100) : 0);

    // Header Background Accent (#059669 - Emerald QC)
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, pageWidth, 48, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SCEDIH — Quality & QA/QC Inspection Register', margin, 30);

    // Subheader
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${project?.name || 'Main Construction Site'}  •  Filter / Scope: ${filterLabel}`, margin, 68);
    doc.text(`Generated: ${currentDate} at ${currentTime}  •  Showing ${total} of ${totalCount ?? total} inspection records`, margin, 82);

    // KPI Cards
    const startY = 94;
    const cardWidth = isLandscape ? (pageWidth - (margin * 2) - 40) / 5 : (pageWidth - (margin * 2) - 30) / 4;
    const cardHeight = 36;
    const cards = [
      { label: 'TOTAL INSPECTIONS', val: `${total}`, color: [11, 95, 255] },
      { label: 'PASSED & SIGNED OFF', val: `${passedCount}`, color: [5, 150, 105] },
      { label: 'OPEN NCRS / FAILED', val: `${failedCount}`, color: [220, 38, 38] },
      { label: 'PENDING APPROVAL', val: `${inReviewCount}`, color: [217, 119, 6] },
      ...(isLandscape ? [{ label: 'SCOPE APPROVED', val: `${overallRate}%`, color: [16, 185, 129] }] : []),
    ];

    cards.forEach((c, i) => {
      const x = margin + i * (cardWidth + 10);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 4, 4, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(c.label, x + 8, startY + 14);

      doc.setFontSize(12);
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.val, x + 8, startY + 30);
    });

    // Table Headers
    const tableHeaders = isLandscape ? [
      ['Ref & Date', 'Subject & Drawing Ref', 'Discipline & Spec', 'Location & Inspector', 'Scope / Quantities', 'Status', 'Contractors & Sign-off']
    ] : [
      ['Ref & Date', 'Subject / Drawing', 'Discipline', 'Location / Inspector', 'Scope & Approved', 'Status']
    ];

    const tableData = inspections.map(i => {
      const docNums = (i.documentNumbers && i.documentNumbers.length > 0)
        ? i.documentNumbers.join(', ')
        : (i.documentNumber || i.referenceDrawingNumber || '-');
      
      const targetQty = i.targetQuantity || 0;
      const inspectedQty = i.inspectedQuantity || 0;
      const approvedQty = i.approvedQuantity || 0;
      const itemUnit = i.unit || 'm';
      const overallPct = targetQty > 0 ? Math.round((approvedQty / targetQty) * 100) : (inspectedQty > 0 ? Math.round((approvedQty / inspectedQty) * 100) : 0);

      const quantitiesStr = targetQty > 0 || inspectedQty > 0
        ? `Scope: ${targetQty} ${itemUnit}\nInsp: ${inspectedQty} ${itemUnit}\n✓ ${approvedQty} ${itemUnit} (${overallPct}% overall)`
        : 'Not recorded';

      if (isLandscape) {
        return [
          `${i.id}\n${i.date || '-'}`,
          `${docNums !== '-' ? `[${docNums}]\n` : ''}${i.title}`,
          `${i.category}\n${i.measurementType || 'Length'} (${itemUnit})${i.toleranceSpec ? `\nSpec: ${i.toleranceSpec}` : ''}`,
          `${i.location}\nInsp: ${i.inspector}${i.subcontractor ? `\nSub: ${i.subcontractor}` : ''}`,
          quantitiesStr,
          i.status,
          `EPC: ${i.epc || 'Scedih'}\nClient: ${i.client || 'Client QC'}`
        ];
      } else {
        return [
          `${i.id}\n${i.date || '-'}`,
          `${docNums !== '-' ? `[${docNums}]\n` : ''}${i.title}`,
          `${i.category}\n${i.measurementType || 'Length'}`,
          `${i.location}\n${i.inspector}`,
          quantitiesStr,
          i.status
        ];
      }
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: startY + cardHeight + 14,
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 5,
        textColor: [15, 23, 42],
        lineColor: [226, 232, 240],
      },
      columnStyles: isLandscape ? {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 200 },
        2: { cellWidth: 105 },
        3: { cellWidth: 125 },
        4: { cellWidth: 110, fontStyle: 'bold' },
        5: { cellWidth: 75, halign: 'center' },
        6: { cellWidth: 85 },
      } : {
        0: { cellWidth: 65, fontStyle: 'bold' },
        1: { cellWidth: 160 },
        2: { cellWidth: 75 },
        3: { cellWidth: 95 },
        4: { cellWidth: 80 },
        5: { cellWidth: 55, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const statusColIdx = isLandscape ? 5 : 5;
          if (data.column.index === statusColIdx) {
            const status = String(data.cell.raw);
            if (status === 'Passed') {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Failed') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Scedih QA/QC Inspection Register & Compliance Record  •  Page ${data.pageNumber}`,
          margin,
          pageHeight - 16
        );
      }
    });

    // Formal Sign-off Section on last page
    if (includeSignoffs) {
      const finalY = (doc as any).lastAutoTable.finalY + 24;
      if (finalY + 60 < pageHeight - 30) {
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('OFFICIAL QUALITY COMPLIANCE & SIGN-OFF ENDORSEMENT', margin, finalY);

        const sigWidth = (pageWidth - (margin * 2) - 40) / 3;
        const signees = [
          { role: 'QA/QC Lead Inspector', subtitle: 'Site Quality Inspection Lead' },
          { role: 'EPC Construction Manager', subtitle: 'Contractor Authorized Rep' },
          { role: 'Client QC Representative', subtitle: 'Client / Consultant Sign-off' },
        ];

        signees.forEach((s, idx) => {
          const sigX = margin + idx * (sigWidth + 20);
          const sigBoxY = finalY + 12;
          doc.setDrawColor(203, 213, 225);
          doc.line(sigX, sigBoxY + 30, sigX + sigWidth, sigBoxY + 30);
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(71, 85, 105);
          doc.text(s.role, sigX, sigBoxY + 42);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);
          doc.text(`Sign & Date: ___________________`, sigX, sigBoxY + 24);
          doc.text(s.subtitle, sigX, sigBoxY + 52);
        });
      }
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `scedih_qa_qc_inspection_register_${dateStr}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: 'Scedih QA/QC Inspection Register PDF',
      text: `Scedih QA/QC Inspection Register Report - ${currentDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating QA PDF:', err);
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    }
    return false;
  }
}

export interface PrintShiftTicketOptions {
  project?: Project;
  activity: Activity;
  supervisorName?: string;
  shiftDate?: string;
  customInstructions?: string;
}

/**
 * Generates an executive 1-Page Printable / PDF Daily Shift Work Order & Execution Ticket
 */
export async function printShiftTicketPdf({
  project,
  activity,
  supervisorName = 'Site Supervisor',
  shiftDate = new Date().toISOString().split('T')[0],
  customInstructions = ''
}: PrintShiftTicketOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    let yPos = margin;

    // Header Bar
    doc.setFillColor(11, 95, 255); // #0B5FFF Primary
    doc.rect(margin, yPos, pageWidth - (margin * 2), 48, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('CONSTRUCTOS • DAILY FIELD WORK ORDER & SHIFT TICKET', margin + 14, yPos + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 235, 255);
    doc.text(`Shift Date: ${shiftDate}  |  WO Ref: WO-${activity.id}-${shiftDate.replace(/-/g, '')}`, margin + 14, yPos + 38);

    yPos += 58;

    // Activity & Project Summary Grid Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 64, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${activity.id}: ${activity.name}`, margin + 12, yPos + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Project: ${project?.name || 'ConstructOS Project'} (${(project as any)?.code || project?.id || 'PROJ-001'})`, margin + 12, yPos + 34);
    doc.text(`Work Package: ${activity.workPackage || 'General'}  |  Discipline: ${activity.discipline || 'General'}`, margin + 12, yPos + 48);

    const rightColX = pageWidth - margin - 190;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Supervisor: ${supervisorName}`, rightColX, yPos + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Target Output: ${activity.targetQuantity ? `${activity.targetQuantity} ${activity.unit || 'units'}` : 'As Scheduled'}`, rightColX, yPos + 34);
    doc.text(`Location / Chainage: ${activity.location || activity.chainage || 'Site Work Zone'}`, rightColX, yPos + 48);

    yPos += 74;

    // Method Subtasks Table
    const subtasks = activity.subtasks || [];
    const subtaskRows = subtasks.length > 0
      ? subtasks.map((st, idx) => {
          const holdStr = st.isHoldPoint ? ' [🔒 QA HOLD POINT]' : '';
          const targetStr = st.targetQuantity ? `${st.targetQuantity} ${st.unit || ''}` : '-';
          const priorStr = `${st.completedQuantity || 0} ${st.unit || ''}`;
          return [
            `#${idx + 1}`,
            `${st.title}${holdStr}\nCategory: ${st.category || 'General'}`,
            targetStr,
            priorStr,
            '[           ]',
            '[  ] In Progress\n[  ] Completed',
            st.isHoldPoint ? 'Approved: [  ]\nSign: ________________' : 'N/A'
          ];
        })
      : [
          ['#1', activity.name, `${activity.targetQuantity || 0} ${activity.unit || ''}`, `${activity.actualQuantity || 0} ${activity.unit || ''}`, '[           ]', '[  ] Completed', 'N/A']
        ];

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['#', 'Method Subtask Scope & Details', 'Target', 'Prior Log', 'Today Output', 'Shift Status', 'QA Sign-Off']],
      body: subtaskRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 4.5,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 24, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 160 },
        2: { cellWidth: 50, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' },
        4: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 75 },
        6: { cellWidth: 99, fontSize: 7.5 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Resource Allocations (2 Columns: Labour & Equipment)
    const midX = pageWidth / 2;
    const colWidth = (pageWidth - (margin * 2) - 10) / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('👷 Allocated Crew Workforce', margin, yPos);
    doc.text('🚜 Allocated Machinery & Plant', margin + colWidth + 10, yPos);

    yPos += 6;

    const crewLines = (activity.assignedLabour || []).length > 0
      ? (activity.assignedLabour || []).map(l => `• ${l.role || 'Worker'}: ${l.name || 'Worker'} (${l.hours || 8}h)`).join('\n')
      : '• Standard trade workforce.';

    const plantLines = (activity.assignedEquipment || []).length > 0
      ? (activity.assignedEquipment || []).map(e => `• ${e.name || e.equipmentId} (Op: ${e.operator || 'Assigned'})`).join('\n')
      : '• Standard tools & plant allocated.';

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, colWidth, 46, 4, 4, 'FD');
    doc.roundedRect(margin + colWidth + 10, yPos, colWidth, 46, 4, 4, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(crewLines, margin + 6, yPos + 12, { maxWidth: colWidth - 12 });
    doc.text(plantLines, margin + colWidth + 16, yPos + 12, { maxWidth: colWidth - 12 });

    yPos += 54;

    // Safety & Special Instructions
    if (customInstructions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(220, 38, 38);
      doc.text('⚠️ Safety Notes & Special Instructions:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(customInstructions, margin + 180, yPos, { maxWidth: pageWidth - margin - 190 });
      yPos += 14;
    }

    // Site Handover & Supervisor Return Sign-off Section
    const signBoxY = pageHeight - margin - 88;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, signBoxY, pageWidth - (margin * 2), 80, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FIELD HANDOVER & DAILY RETURN VERIFICATION', margin + 10, signBoxY + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Shift Weather / Temp: ____________________', margin + 10, signBoxY + 30);
    doc.text('Delays / Blockers: __________________________________________________________________', margin + 10, signBoxY + 44);
    doc.text('Supervisor Notes: ____________________________________________________________________', margin + 10, signBoxY + 58);

    doc.setFont('helvetica', 'bold');
    doc.text(`Supervisor Sign: _________________________`, margin + 10, signBoxY + 72);
    doc.text(`QA/QC Inspector Sign: _________________________`, rightColX, signBoxY + 72);

    const filename = `Shift_Ticket_${activity.id}_${shiftDate}.pdf`;
    const blob = doc.output('blob');

    await saveOrShareFile({
      filename,
      blob,
      title: `Shift Work Order - ${activity.id}`,
      text: `Shift Work Order Ticket for ${activity.name} on ${shiftDate}`
    });

    return true;
  } catch (err) {
    console.error('Error generating shift ticket PDF:', err);
    return false;
  }
}

