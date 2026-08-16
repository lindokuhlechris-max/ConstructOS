import { Activity, DocumentItem, MaterialInventory, Project, AuditLog } from '../types';

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
 * Generates an executive, beautifully formatted printable HTML document
 * in a dedicated hidden iframe or window and triggers window.print().
 * This allows browser-native PDF export without disrupting the host iframe / main app.
 */
export function printActivitiesSummary({
  project,
  activities,
  filterLabel = 'All Activities',
  totalActivitiesCount,
}: PrintSummaryOptions) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate high-level summary KPIs
  const total = activities.length;
  const inProgress = activities.filter(a => a.status === 'In Progress').length;
  const completed = activities.filter(a => a.status === 'Completed').length;
  const blocked = activities.filter(a => a.status === 'Blocked' || a.status === 'Waiting' || a.status === 'Cancelled').length;
  const notStarted = activities.filter(a => a.status === 'Not Started' || a.status === 'Ready').length;
  const avgProgress = total > 0 
    ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / total) 
    : 0;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
      case 'In Progress':
        return 'background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;';
      case 'Blocked':
      case 'Cancelled':
        return 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
      default:
        return 'background-color: #fefce8; color: #854d0e; border: 1px solid #fef08a;';
    }
  };

  const getPriorityStyle = (priority?: string) => {
    if (priority === 'Critical') return 'color: #dc2626; font-weight: 700;';
    if (priority === 'High') return 'color: #ea580c; font-weight: 600;';
    return 'color: #4b5563; font-weight: 500;';
  };

  const tableRows = activities.map((act, index) => `
    <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; font-family: monospace; font-weight: bold; font-size: 11px; color: #334155;">${act.id}</td>
      <td style="padding: 8px 10px;">
        <div style="font-weight: 600; color: #0f172a; font-size: 12px;">${act.name}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          ${act.area ? `Area: <strong>${act.area}</strong>` : ''} 
          ${act.workPackage ? `• Package: <strong>${act.workPackage}</strong>` : ''}
          ${act.supervisor ? `• Sup: <strong>${act.supervisor}</strong>` : ''}
        </div>
      </td>
      <td style="padding: 8px 10px; font-size: 11px;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background-color: #e0f2fe; color: #0369a1;">
          ${act.discipline || 'Civil'}
        </span>
      </td>
      <td style="padding: 8px 10px; font-size: 11px; ${getPriorityStyle(act.priority)}">
        ${act.priority || 'Medium'}
      </td>
      <td style="padding: 8px 10px; font-size: 11px; font-weight: 600; color: #334155; white-space: nowrap;">
        ${act.actualQuantity ?? 0} / ${act.targetQuantity ?? 0} <span style="font-size: 9px; color: #64748b; font-weight: normal;">${act.unit || 'units'}</span>
      </td>
      <td style="padding: 8px 10px; font-size: 11px; white-space: nowrap;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; ${getStatusBadgeStyle(act.status)}">
          ${act.status}
        </span>
      </td>
      <td style="padding: 8px 10px; font-size: 11px; color: #475569; font-family: monospace; white-space: nowrap;">
        ${act.startDate || '—'}
      </td>
      <td style="padding: 8px 10px; text-align: right; white-space: nowrap;">
        <div style="font-weight: 700; font-size: 11px; color: #0f172a;">${act.progress}%</div>
        <div style="width: 55px; height: 5px; background-color: #e2e8f0; border-radius: 9999px; margin-left: auto; margin-top: 3px; overflow: hidden;">
          <div style="width: ${Math.min(act.progress, 100)}%; height: 100%; background-color: ${act.progress === 100 ? '#10b981' : '#0b5fff'}; border-radius: 9999px;"></div>
        </div>
      </td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Construction Activities Summary - ${project?.name || 'Project'}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 12mm 12mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b5fff;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .title-area h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      padding: 8px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title-area">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #0b5fff; color: white; padding: 3px 6px; border-radius: 4px; font-weight: 900; font-size: 10px; letter-spacing: 0.05em;">CONSTRUCTOS</span>
        <h1>Construction Activities Summary Report</h1>
      </div>
      <p>Project: <strong>${project?.name || 'Main Project'}</strong> • Location: <strong>${project?.location || 'Jobsite'}</strong> • View: <strong>${filterLabel}</strong></p>
    </div>
    <div class="meta-box">
      <div>Generated on: <strong>${currentDate} at ${currentTime}</strong></div>
      <div>Showing: <strong>${total}</strong> of <strong>${totalActivitiesCount ?? total}</strong> recorded tasks</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Selected</div>
      <div class="kpi-value" style="color: #0b5fff;">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">In Progress</div>
      <div class="kpi-value" style="color: #2563eb;">${inProgress}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Completed</div>
      <div class="kpi-value" style="color: #059669;">${completed}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Blocked / Delayed</div>
      <div class="kpi-value" style="color: ${blocked > 0 ? '#dc2626' : '#64748b'};">${blocked}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Not Started</div>
      <div class="kpi-value" style="color: #d97706;">${notStarted}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Avg. Progress</div>
      <div class="kpi-value" style="color: #4f46e5;">${avgProgress}%</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 70px;">ID</th>
        <th>Activity Name & Scope Details</th>
        <th style="width: 80px;">Discipline</th>
        <th style="width: 70px;">Priority</th>
        <th style="width: 100px;">Qty / Target</th>
        <th style="width: 100px;">Status</th>
        <th style="width: 90px;">Start Date</th>
        <th style="width: 80px; text-align: right;">Progress</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>ConstructOS Enterprise Field Management • Official Site Record</div>
    <div>Page 1 of 1 • Signed by Site Supervisor: __________________________</div>
  </div>
</body>
</html>
  `;

  // Use a hidden iframe to print cleanly without opening unwanted blank popups or navigating away
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback to window.print if iframe document not accessible
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Wait for rendering then trigger native print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print:', err);
      window.print();
    } finally {
      // Remove iframe after user dismisses print dialogue
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

/**
 * Generates an executive, beautifully formatted printable HTML report of Material Inventory
 * and triggers browser print / PDF export.
 */
export function printMaterialsSummary({
  project,
  materials,
  filterLabel = 'All Material Items',
  totalMaterialsCount,
}: PrintMaterialsOptions) {
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
  let overEstimateCount = 0;
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
    } else if (m.usedQuantity > m.estimatedQuantity) {
      overEstimateCount++;
    } else {
      inStockCount++;
    }
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
      case 'Low Stock':
        return 'background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
      case 'Out of Stock':
        return 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
      case 'Over Estimate':
        return 'background-color: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff;';
      default:
        return 'background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;';
    }
  };

  const tableRows = materials.map((mat, index) => {
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

    return `
    <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; font-family: monospace; font-weight: bold; font-size: 11px; color: #334155;">
        ${mat.id}
        ${mat.sku ? `<div style="font-size: 9px; color: #64748b; font-weight: normal;">SKU: ${mat.sku}</div>` : ''}
      </td>
      <td style="padding: 8px 10px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${mat.name}</div>
        ${mat.location ? `<div style="font-size: 10px; color: #64748b; margin-top: 1px;">Loc / Supplier: <strong>${mat.location}</strong></div>` : ''}
      </td>
      <td style="padding: 8px 10px; font-size: 11px;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
          ${mat.category || 'General'}
        </span>
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #334155;">
        ${mat.estimatedQuantity.toLocaleString()} <span style="font-size: 9px; color: #64748b; font-weight: normal;">${mat.unit}</span>
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 11px; color: #64748b; font-weight: 500;">
        ${threshold.toLocaleString()} <span style="font-size: 9px;">${mat.unit}</span>
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #0f172a;">
        ${mat.receivedQuantity.toLocaleString()}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 11px; font-weight: 600; color: #475569;">
        ${mat.usedQuantity.toLocaleString()}
      </td>
      <td style="padding: 8px 10px; text-align: right; font-size: 11px; font-weight: 800; color: ${isLow ? '#dc2626' : '#059669'};">
        ${balance.toLocaleString()} <span style="font-size: 9px; font-weight: normal;">${mat.unit}</span>
      </td>
      <td style="padding: 8px 10px; text-align: center; white-space: nowrap;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; ${getStatusBadgeStyle(computedStatus)}">
          ${computedStatus}
        </span>
      </td>
      <td style="padding: 8px 10px; text-align: right; white-space: nowrap;">
        <div style="font-weight: 700; font-size: 11px; color: #0f172a;">${usageRatio}%</div>
        <div style="width: 55px; height: 5px; background-color: #e2e8f0; border-radius: 9999px; margin-left: auto; margin-top: 3px; overflow: hidden;">
          <div style="width: ${usageRatio}%; height: 100%; background-color: ${usageRatio > 90 ? '#ef4444' : '#0b5fff'}; border-radius: 9999px;"></div>
        </div>
      </td>
    </tr>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Material Inventory & Reorder Summary - ${project?.name || 'ConstructOS Site'}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 12mm 12mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b5fff;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .title-area h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      padding: 8px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title-area">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #0b5fff; color: white; padding: 3px 6px; border-radius: 4px; font-weight: 900; font-size: 10px; letter-spacing: 0.05em;">CONSTRUCTOS</span>
        <h1>Material Inventory & Reorder Report</h1>
      </div>
      <p>Project: <strong>${project?.name || 'Main Construction Site'}</strong> • Scope: <strong>${filterLabel}</strong></p>
    </div>
    <div class="meta-box">
      <div>Report Date: <strong>${currentDate} at ${currentTime}</strong></div>
      <div>Listed Materials: <strong>${total}</strong> of <strong>${totalMaterialsCount ?? total}</strong> items</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total SKUs</div>
      <div class="kpi-value" style="color: #0b5fff;">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">In Stock</div>
      <div class="kpi-value" style="color: #059669;">${inStockCount}</div>
    </div>
    <div class="kpi-card" style="${lowStockCount > 0 ? 'border-color: #fca5a5; background: #fff1f2;' : ''}">
      <div class="kpi-label" style="${lowStockCount > 0 ? 'color: #b91c1c;' : ''}">Below Threshold</div>
      <div class="kpi-value" style="color: ${lowStockCount > 0 ? '#dc2626' : '#64748b'};">${lowStockCount}</div>
    </div>
    <div class="kpi-card" style="${outOfStockCount > 0 ? 'border-color: #fca5a5; background: #fff1f2;' : ''}">
      <div class="kpi-label" style="${outOfStockCount > 0 ? 'color: #b91c1c;' : ''}">Out of Stock</div>
      <div class="kpi-value" style="color: ${outOfStockCount > 0 ? '#dc2626' : '#64748b'};">${outOfStockCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Received</div>
      <div class="kpi-value" style="color: #2563eb;">${totalReceivedUnits.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Used</div>
      <div class="kpi-value" style="color: #4f46e5;">${totalUsedUnits.toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Material ID</th>
        <th>Material Name & Location</th>
        <th style="width: 85px;">Category</th>
        <th style="width: 85px; text-align: right;">Estimate</th>
        <th style="width: 85px; text-align: right;">Alert Min</th>
        <th style="width: 80px; text-align: right;">Received</th>
        <th style="width: 75px; text-align: right;">Used</th>
        <th style="width: 95px; text-align: right;">Available Bal.</th>
        <th style="width: 90px; text-align: center;">Status</th>
        <th style="width: 80px; text-align: right;">Usage %</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>ConstructOS Materials Management • Official Warehouse & Jobsite Log</div>
    <div>Verified & Signed by Storekeeper / Engineer: __________________________</div>
  </div>
</body>
</html>
  `;

  // Hidden iframe pattern
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

/**
 * Generates an executive, beautifully formatted printable HTML report of Document Register & Drawings Hub
 * and triggers browser print / PDF export.
 */
export function printDocumentsSummary({
  project,
  documents,
  filterLabel = 'All Project Documents',
  totalDocumentsCount,
}: PrintDocumentsOptions) {
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;';
      case 'Under Review':
        return 'background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a;';
      case 'Draft':
        return 'background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
      case 'Archived':
        return 'background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;';
      case 'Superseded':
        return 'background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca;';
      default:
        return 'background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;';
    }
  };

  const getFileTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;';
      case 'excel':
        return 'background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;';
      case 'word':
        return 'background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;';
      case 'cad':
        return 'background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5;';
      default:
        return 'background-color: #f8fafc; color: #475569; border: 1px solid #e2e8f0;';
    }
  };

  const tableRows = documents.map((doc, index) => {
    const uploadDateStr = doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-GB') : '-';
    
    return `
    <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
      <td style="padding: 8px 10px; font-family: monospace; font-weight: bold; font-size: 11px; color: #334155;">
        ${doc.id}
        <div style="font-size: 9px; color: #64748b; font-weight: normal; margin-top: 2px;">${doc.version}</div>
      </td>
      <td style="padding: 8px 10px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${doc.title}</div>
        <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 1px;">${doc.fileName} (${doc.fileSizeFormatted || 'Unknown'})</div>
        ${doc.description ? `<div style="font-size: 10px; color: #475569; margin-top: 3px; font-style: italic;">${doc.description}</div>` : ''}
      </td>
      <td style="padding: 8px 10px; font-size: 10px; white-space: nowrap;">
        <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; ${getFileTypeBadgeStyle(doc.fileType)}">
          ${doc.fileExtension.toUpperCase()}
        </span>
      </td>
      <td style="padding: 8px 10px; font-size: 11px; color: #334155; font-weight: 500;">
        ${doc.category}
      </td>
      <td style="padding: 8px 10px; font-size: 11px;">
        ${doc.linkedActivityName ? `
          <div style="font-weight: 700; color: #0b5fff; font-size: 11px;">${doc.linkedActivityName}</div>
          <div style="font-size: 9px; color: #64748b;">ID: ${doc.linkedActivityId}</div>
        ` : `
          <span style="color: #94a3b8; font-size: 10px; font-style: italic;">Unassigned</span>
        `}
      </td>
      <td style="padding: 8px 10px; text-align: center; white-space: nowrap;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; ${getStatusBadgeStyle(doc.status)}">
          ${doc.status}
        </span>
      </td>
      <td style="padding: 8px 10px; font-size: 10px; color: #475569; white-space: nowrap;">
        <div>${doc.uploadedBy}</div>
        <div style="font-size: 9px; color: #64748b;">${uploadDateStr}</div>
      </td>
    </tr>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Register & Technical Drawings - ${project?.name || 'ConstructOS Project'}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 12mm 12mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b5fff;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .title-area h1 {
      margin: 0;
      font-size: 20px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area p {
      margin: 3px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      padding: 8px 10px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .footer {
      margin-top: 18px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title-area">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #0b5fff; color: white; padding: 3px 6px; border-radius: 4px; font-weight: 900; font-size: 10px; letter-spacing: 0.05em;">CONSTRUCTOS</span>
        <h1>Project Document Register & Drawing Transmittal</h1>
      </div>
      <p>Project: <strong>${project?.name || 'Main Construction Site'}</strong> • Scope: <strong>${filterLabel}</strong></p>
    </div>
    <div class="meta-box">
      <div>Report Date: <strong>${currentDate} at ${currentTime}</strong></div>
      <div>Listed Files: <strong>${total}</strong> of <strong>${totalDocumentsCount ?? total}</strong> documents</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Documents</div>
      <div class="kpi-value" style="color: #0b5fff;">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Approved</div>
      <div class="kpi-value" style="color: #059669;">${approvedCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Under Review</div>
      <div class="kpi-value" style="color: #d97706;">${underReviewCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Activity Linked</div>
      <div class="kpi-value" style="color: #2563eb;">${assignedToActivityCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Drawings & CAD</div>
      <div class="kpi-value" style="color: #ea580c;">${drawingsCount}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Excel Spreadsheets</div>
      <div class="kpi-value" style="color: #059669;">${spreadsheetsCount}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Doc ID</th>
        <th>Document Title & File</th>
        <th style="width: 60px;">Format</th>
        <th style="width: 140px;">Category</th>
        <th style="width: 160px;">Assigned Activity</th>
        <th style="width: 95px; text-align: center;">Status</th>
        <th style="width: 110px;">Uploaded By</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>ConstructOS Document Control & Field Quality System • Confidential Transmittal Register</div>
    <div>Document Controller Signature: __________________________ Date: _____________</div>
  </div>
</body>
</html>
  `;

  // Hidden iframe pattern
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

/**
 * Generates an executive, beautifully formatted printable HTML document
 * for the Activity & Subtask Audit Ledger in a dedicated hidden iframe.
 * Avoids interactive inputs, buttons, and giant padding from polluting the print output.
 */
export function printActivityAuditSummary({
  project,
  logs,
  filterLabel = 'All Events',
  totalLogsCount,
  activityName,
}: PrintActivityAuditOptions) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate high-level summary KPIs
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

  const getActionBadgeHtml = (action: string, actionType?: string, details?: string) => {
    const actLower = action.toLowerCase();
    const detLower = (details || '').toLowerCase();

    if (actLower.includes('qa') || detLower.includes('qa hold point') || detLower.includes('qa inspection')) {
      return `<span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">QA APPROVED</span>`;
    }
    if (actLower.includes('progress') || detLower.includes('progress logged')) {
      return `<span style="background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">PROGRESS LOGGED</span>`;
    }
    if (actLower.includes('subtask') && (actLower.includes('completed') || detLower.includes('completed'))) {
      return `<span style="background-color: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">SUBTASK COMPLETED</span>`;
    }
    if (actionType === 'delete' || actLower.includes('delete') || actLower.includes('remove')) {
      return `<span style="background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">DELETED</span>`;
    }
    if (actionType === 'update' || actLower.includes('edit') || actLower.includes('update') || actLower.includes('modify')) {
      return `<span style="background-color: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">EDITED</span>`;
    }
    if (actionType === 'create' || actLower.includes('add') || actLower.includes('create')) {
      return `<span style="background-color: #ecfeff; color: #0e7490; border: 1px solid #a5f3fc; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">CREATED</span>`;
    }
    if (actionType === 'status_change' || actLower.includes('status')) {
      return `<span style="background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">STATUS CHANGE</span>`;
    }
    return `<span style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase;">LOGGED</span>`;
  };

  const tableRows = logs.map((log, index) => {
    const formattedDate = new Date(log.timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const diffContent = (log.previousValue || log.newValue) ? `
      <div style="margin-top: 3px; font-family: monospace; font-size: 9.5px; color: #64748b; background: #f8fafc; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0; display: inline-block;">
        ${log.previousValue ? `<span style="text-decoration: line-through; color: #ef4444;">${log.previousValue}</span> → ` : ''}
        <strong style="color: #059669;">${log.newValue || ''}</strong>
      </div>
    ` : '';

    const inspectorContent = log.inspectorName ? `
      <div style="margin-top: 3px; font-size: 10px; color: #065f46; background: #ecfdf5; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
        <strong>QA Inspector:</strong> ${log.inspectorName} ${log.metadata?.signatureNote ? `• <em>"${log.metadata.signatureNote}"</em>` : ''}
      </div>
    ` : '';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 6px 8px; font-family: monospace; font-size: 10px; color: #475569; white-space: nowrap;">
          ${formattedDate}
        </td>
        <td style="padding: 6px 8px; white-space: nowrap;">
          ${getActionBadgeHtml(log.action, log.actionType, log.details)}
        </td>
        <td style="padding: 6px 8px; font-size: 11px; font-weight: 600; color: #0f172a;">
          ${log.activityName || log.entityId || 'Activity'}
        </td>
        <td style="padding: 6px 8px; font-size: 10.5px; color: #6d28d9; font-weight: 500;">
          ${log.subtaskTitle || '—'}
        </td>
        <td style="padding: 6px 8px; font-size: 11px; color: #1e293b; max-width: 320px;">
          <div>${log.details}</div>
          ${diffContent}
          ${inspectorContent}
        </td>
        <td style="padding: 6px 8px; font-size: 10.5px; color: #334155; font-weight: 600; white-space: nowrap;">
          ${log.userId || 'Current User'}
        </td>
        <td style="padding: 6px 8px; font-family: monospace; font-size: 9.5px; color: #94a3b8; text-align: center; white-space: nowrap;">
          ${log.id}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Activity & Subtask Audit Ledger - ${project?.name || 'Project'}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 10mm 10mm 10mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0b5fff;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .title-area h1 {
      margin: 0;
      font-size: 18px;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area p {
      margin: 2px 0 0 0;
      font-size: 10.5px;
      color: #64748b;
    }
    .meta-box {
      text-align: right;
      font-size: 10.5px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      text-align: center;
    }
    .kpi-label {
      font-size: 8.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 1px;
    }
    .kpi-value {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      text-align: left;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .footer {
      margin-top: 14px;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="title-area">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: #0b5fff; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 900; font-size: 9.5px; letter-spacing: 0.05em;">CONSTRUCTOS</span>
        <h1>Activity & Subtasks Audit Ledger Report</h1>
      </div>
      <p>Project: <strong>${project?.name || 'ConstructOS Project'}</strong> • Filter: <strong>${filterLabel}</strong> ${activityName ? `• Activity: <strong>${activityName}</strong>` : ''}</p>
    </div>
    <div class="meta-box">
      <div>Generated: <strong>${currentDate} at ${currentTime}</strong></div>
      <div>Showing: <strong>${total}</strong> of <strong>${totalLogsCount ?? total}</strong> recorded audit events</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Events</div>
      <div class="kpi-value" style="color: #0b5fff;">${total}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Subtask Updates</div>
      <div class="kpi-value" style="color: #059669;">${subtaskEvents}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">QA Hold Points</div>
      <div class="kpi-value" style="color: #4f46e5;">${qaApprovals}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Progress Logs</div>
      <div class="kpi-value" style="color: #2563eb;">${progressLogs}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Deletions</div>
      <div class="kpi-value" style="color: ${deletions > 0 ? '#dc2626' : '#64748b'};">${deletions}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 110px;">Date & Time</th>
        <th style="width: 120px;">Action Type</th>
        <th style="width: 140px;">Activity / Scope</th>
        <th style="width: 130px;">Subtask Deliverable</th>
        <th>Details, Notes & State Mutations</th>
        <th style="width: 110px;">Actor / User</th>
        <th style="width: 75px; text-align: center;">Audit ID</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows.length > 0 ? tableRows : `
        <tr>
          <td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic;">
            No audit records matching the specified filters.
          </td>
        </tr>
      `}
    </tbody>
  </table>

  <div class="footer">
    <div>ConstructOS Enterprise Field Governance & Audit Trail • Official Project Record</div>
    <div>QA / Site Manager Sign-Off Signature: _________________________________ Date: _________________</div>
  </div>
</body>
</html>
  `;

  // Hidden iframe print pattern
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Error invoking print:', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}



