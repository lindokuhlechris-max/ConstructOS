import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AccommodationUnit, AccommodationUtilityLog, Employee } from '../types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: { finalY: number };
  }
}

/**
 * Calculates the active monthly lease cost for an accommodation based on its pricing model and occupancy
 */
export function calculateAccommodationMonthlyCost(unit: AccommodationUnit): number {
  if (unit.ownership !== 'Rented') return 0;

  const rateType = unit.rentalRateType || 'Fixed Monthly';
  const ratePerUnit = unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : (unit.rentalMonthlyCost || 0);
  const occupantCount = unit.occupantIds?.length || 0;
  const roomCount = unit.totalRooms || 1;

  switch (rateType) {
    case 'Per Occupant / Bed (Monthly)':
      return ratePerUnit * occupantCount;
    case 'Per Room (Monthly)':
      return ratePerUnit * roomCount;
    case 'Daily / Per Night per Person':
      return ratePerUnit * occupantCount * 30; // standard 30-day billing period
    case 'Fixed Monthly':
    default:
      return unit.rentalMonthlyCost !== undefined ? unit.rentalMonthlyCost : ratePerUnit;
  }
}

/**
 * Human readable rate model label
 */
export function getAccommodationRateDescription(unit: AccommodationUnit): string {
  if (unit.ownership !== 'Rented') return 'Company Owned (No Lease)';

  const rateType = unit.rentalRateType || 'Fixed Monthly';
  const ratePerUnit = unit.rentalRatePerUnit !== undefined ? unit.rentalRatePerUnit : (unit.rentalMonthlyCost || 0);
  const occupantCount = unit.occupantIds?.length || 0;
  const roomCount = unit.totalRooms || 1;

  switch (rateType) {
    case 'Per Occupant / Bed (Monthly)':
      return `R ${ratePerUnit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} / person/month × ${occupantCount} occupant${occupantCount !== 1 ? 's' : ''}`;
    case 'Per Room (Monthly)':
      return `R ${ratePerUnit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} / room/month × ${roomCount} room${roomCount !== 1 ? 's' : ''}`;
    case 'Daily / Per Night per Person':
      return `R ${ratePerUnit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} / person/night × ${occupantCount} occupant${occupantCount !== 1 ? 's' : ''} (30 days)`;
    case 'Fixed Monthly':
    default:
      return `Fixed Lease (R ${(unit.rentalMonthlyCost || ratePerUnit).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} / month)`;
  }
}

/**
 * Generates an executive PDF report for a specific accommodation facility
 */
export const generateAccommodationMonthlyPDF = (
  unit: AccommodationUnit,
  utilities: AccommodationUtilityLog[],
  employees: Employee[],
  currency: string = 'ZAR'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Brand Colors: Deep Navy & Constructfield Blue
  const primaryBlue: [number, number, number] = [11, 95, 255]; // #0B5FFF
  const darkSlate: [number, number, number] = [15, 23, 42]; // #0F172A
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const emeraldGreen: [number, number, number] = [16, 185, 129];
  const amberOrange: [number, number, number] = [217, 119, 6];

  // Top Header Banner
  doc.setFillColor(...primaryBlue);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CONSTRUCTFIELD FACILITIES MANAGEMENT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Accommodation & Camp Monthly Operational Statement', pageWidth - 14, 15, { align: 'right' });

  // Facility Title & Meta Box
  let currentY = 34;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(unit.name, 14, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  currentY += 6;
  doc.text(`Location: ${unit.location} ${unit.address ? `• ${unit.address}` : ''}`, 14, currentY);

  const reportDate = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Statement Date: ${reportDate} | ID: ${unit.id}`, pageWidth - 14, currentY, { align: 'right' });

  // Key Financial & Capacity KPI Cards
  currentY += 8;
  const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
  const activeMonthlyLease = calculateAccommodationMonthlyCost(unit);
  const totalUtilitiesCost = utilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
  const totalOperationalCost = activeMonthlyLease + totalUtilitiesCost;
  const occupancyPct = unit.totalCapacityBeds > 0 ? Math.round((occupants.length / unit.totalCapacityBeds) * 100) : 0;

  // KPI Summary Table
  doc.autoTable({
    startY: currentY,
    head: [['Facility Specs', 'Occupancy Status', 'Active Monthly Lease', 'Utilities Incurred', 'Total Monthly Cost']],
    body: [[
      `${unit.ownership}\n${unit.type}\n${unit.totalRooms ? `${unit.totalRooms} Rooms` : 'Modular Unit'}`,
      `${occupants.length} / ${unit.totalCapacityBeds} Beds\n(${occupancyPct}% Occupied)\n${Math.max(0, unit.totalCapacityBeds - occupants.length)} Vacant Beds`,
      `R ${activeMonthlyLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n${getAccommodationRateDescription(unit)}`,
      `R ${totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n(${utilities.length} logged bills)`,
      `R ${totalOperationalCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\nCombined Ops`
    ]],
    theme: 'grid',
    headStyles: { fillColor: primaryBlue, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: darkSlate, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Section 1: Lease & Landlord Information (If rented)
  if (unit.ownership === 'Rented') {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkSlate);
    doc.text('Lease & Landlord Agreement Terms', 14, currentY);
    currentY += 4;

    doc.autoTable({
      startY: currentY,
      head: [['Landlord / Vendor', 'Agreement / PO #', 'Pricing Model', 'Unit Rate / Base Cost', 'Lease Period', 'Deposit Paid']],
      body: [[
        unit.rentalVendor || 'Private Landlord',
        unit.rentalAgreementNumber || 'N/A',
        unit.rentalRateType || 'Fixed Monthly',
        `R ${(unit.rentalRatePerUnit || unit.rentalMonthlyCost || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
        `${unit.rentalStartDate || 'Ongoing'} to ${unit.rentalEndDate || 'Ongoing'}`,
        unit.rentalDepositPaid ? `R ${unit.rentalDepositPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'R 0.00'
      ]],
      theme: 'grid',
      headStyles: { fillColor: amberOrange, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: darkSlate, cellPadding: 2.5 }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Section 2: Resident Staff Roster Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`Resident Personnel Roster (${occupants.length} Allocated Workers)`, 14, currentY);
  currentY += 4;

  if (occupants.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...textMuted);
    doc.text('No employees currently allocated to this accommodation facility.', 14, currentY + 3);
    currentY += 10;
  } else {
    const occupantRows = occupants.map((emp, index) => {
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
      return [
        (index + 1).toString(),
        emp.id,
        fullName,
        emp.position || (emp as any).role || 'Staff',
        emp.department || 'Operations',
        emp.accommodationDetails?.roomNumber || '—',
        emp.accommodationDetails?.checkInDate || unit.createdAt || '—',
        emp.phone || '—'
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [['#', 'Emp ID', 'Staff Name', 'Position / Role', 'Department', 'Room / Bed #', 'Check-in Date', 'Contact']],
      body: occupantRows,
      theme: 'grid',
      headStyles: { fillColor: darkSlate, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: darkSlate, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Section 3: Utilities & Running Expenses Table
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`Logged Utility & Running Expenses (Total: R ${totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})`, 14, currentY);
  currentY += 4;

  if (utilities.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...textMuted);
    doc.text('No utility expenses logged for this facility during this billing cycle.', 14, currentY + 3);
    currentY += 10;
  } else {
    const utilityRows = utilities.map(u => [
      u.date,
      u.utilityType,
      u.unitsConsumed ? `${u.unitsConsumed} ${u.unitLabel || 'Units'}` : '—',
      u.vendorOrProvider || '—',
      u.invoiceOrReceiptNumber || '—',
      `R ${u.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
      u.paidStatus
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Date', 'Utility Category', 'Units / Consumed', 'Vendor / Supplier', 'Receipt / Token #', 'Amount (ZAR)', 'Status']],
      body: utilityRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: darkSlate, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Footer & Sign-off Block
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text(`Camp Contact / Supervisor: ${unit.contactPerson || 'Site Camp Supervisor'} ${unit.contactPhone ? `(${unit.contactPhone})` : ''}`, 14, currentY);
  doc.text('Constructfield OS Facility Automated Statement', pageWidth - 14, currentY, { align: 'right' });

  // Save the PDF
  const sanitizedName = unit.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Constructfield_Accommodation_${sanitizedName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
