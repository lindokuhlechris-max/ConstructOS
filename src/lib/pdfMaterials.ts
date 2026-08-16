import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable if not recognized
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: { finalY: number };
  }
}

export const generateRequestsPDF = (requests: any[], project: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(11, 95, 255); // #0B5FFF
  doc.text('Material Requests Report', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Project: ${project?.name || 'Constructfield Project'}`, 14, 30);
  doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 35);
  
  // Stats
  const pending = requests.filter(r => r.status === 'Pending').length;
  const approved = requests.filter(r => r.status === 'Approved').length;
  const delivered = requests.filter(r => r.status === 'Delivered').length;
  const total = requests.length;
  
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Requests: ${total} | Pending: ${pending} | Approved: ${approved} | Delivered: ${delivered}`, 14, 45);

  const tableData = requests.map(req => [
    req.id,
    req.material,
    req.type || 'Consumable',
    `${req.quantity} ${req.unit}`,
    req.requestedBy,
    req.date,
    req.status
  ]);

  doc.autoTable({
    startY: 55,
    head: [['ID', 'Material', 'Type', 'Quantity', 'Requested By', 'Date', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [11, 95, 255], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  doc.save(`Material-Requests-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateCostsPDF = (materials: any[], requests: any[], project: any, currency: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(11, 95, 255); // #0B5FFF
  doc.text('Material Costs & Financial Summary', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Project: ${project?.name || 'Constructfield Project'}`, 14, 30);
  doc.text(`Date Generated: ${new Date().toLocaleDateString()} | Currency: ${currency}`, 14, 35);
  
  // Calculate Stores Financials
  const totalEstimated = materials.reduce((acc, curr) => acc + (curr.estimatedQuantity * (curr.unitCost || curr.costPerUnit || 0)), 0);
  const currentInventoryValue = materials.reduce((acc, curr) => {
    const balance = curr.receivedQuantity - curr.usedQuantity;
    return acc + (Math.max(0, balance) * (curr.unitCost || curr.costPerUnit || 0));
  }, 0);
  const totalConsumed = materials.reduce((acc, curr) => acc + (curr.usedQuantity * (curr.unitCost || curr.costPerUnit || 0)), 0);

  let currentY = 50;
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Company Stores - Financial Summary', 14, currentY);
  currentY += 10;
  
  doc.autoTable({
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Estimated Budget', `${currency} ${totalEstimated.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
      ['Current Inventory Value', `${currency} ${currentInventoryValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
      ['Total Consumed Costs', `${currency} ${totalConsumed.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  currentY = doc.lastAutoTable.finalY + 20;

  // Calculate Requests Financials
  const reqTotalEst = requests.reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0);
  const reqPending = requests.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0);
  const reqApproved = requests.filter(r => r.status === 'Approved' || r.status === 'Delivered').reduce((acc, curr) => acc + (curr.quantity * (Number(curr.price) || 0)), 0);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Material Requests - Cost Summary', 14, currentY);
  currentY += 10;
  
  doc.autoTable({
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Estimated Requests Cost', `${currency} ${reqTotalEst.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
      ['Pending Requests Cost', `${currency} ${reqPending.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
      ['Approved/Delivered Cost', `${currency} ${reqApproved.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // Could also add a breakdown table of top costs, but let's keep it simple first
  doc.save(`Material-Costs-${new Date().toISOString().split('T')[0]}.pdf`);
};
