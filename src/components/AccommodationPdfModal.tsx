import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Layers, 
  ShieldCheck, 
  Check, 
  Eye, 
  Sparkles,
  Settings2,
  Filter,
  Users,
  Home,
  Zap,
  DollarSign,
  Bed,
  MapPin,
  FileCheck,
  CreditCard,
  CheckCircle,
  Tag
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, ProgressBar } from './ui';
import { AccommodationUnit, AccommodationUtilityLog, AccommodationPaymentLog, Employee } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveOrShareFile } from '../lib/fileExportService';
import { calculateAccommodationMonthlyCost, getAccommodationRateDescription } from '../lib/pdfAccommodation';

export interface AccommodationPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodations: AccommodationUnit[];
  utilities: AccommodationUtilityLog[];
  employees: Employee[];
  payments?: AccommodationPaymentLog[];
  currentUserProfile?: { name?: string; role?: string; email?: string } | null;
  defaultFacilityId?: string;
  defaultFilterLabel?: string;
}

export type AccommodationReportTemplateType = 
  | 'executive'     // Executive Accommodation Portfolio Summary
  | 'detailed'      // Detailed Facility Dossier & Specifications
  | 'roster'        // Resident Staff Housing & Occupancy Roster
  | 'utilities';    // Utilities & Operating Expenses Ledger

export function AccommodationPdfModal({
  isOpen,
  onClose,
  accommodations,
  utilities = [],
  employees = [],
  payments = [],
  currentUserProfile,
  defaultFacilityId = 'all',
  defaultFilterLabel = 'All Facilities'
}: AccommodationPdfModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Configuration State
  const [selectedTemplate, setSelectedTemplate] = useState<AccommodationReportTemplateType>('executive');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(defaultFacilityId);
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reportTitle, setReportTitle] = useState<string>('Accommodation & Housing Operations Master Report');
  const [reportSubtitle, setReportSubtitle] = useState<string>(defaultFilterLabel);
  const [preparedBy, setPreparedBy] = useState<string>(
    currentUserProfile?.name 
      ? `${currentUserProfile.name} (${currentUserProfile.role || 'Facilities Manager'})`
      : 'Site Facilities & Camp Manager'
  );
  
  // Feature Toggles
  const [includeKpiSummary, setIncludeKpiSummary] = useState<boolean>(true);
  const [includeResidentRoster, setIncludeResidentRoster] = useState<boolean>(true);
  const [includeUtilitiesBreakdown, setIncludeUtilitiesBreakdown] = useState<boolean>(true);
  const [includeSignoff, setIncludeSignoff] = useState<boolean>(true);

  // Tab mode
  const [activeTab, setActiveTab] = useState<'preview' | 'config'>('preview');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Sync body class for print isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('print-modal-open');
    } else {
      document.body.classList.remove('print-modal-open');
    }
    return () => document.body.classList.remove('print-modal-open');
  }, [isOpen]);

  // Filtered dataset
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter(unit => {
      if (selectedFacilityId !== 'all' && unit.id !== selectedFacilityId) return false;
      if (ownershipFilter !== 'all' && unit.ownership !== ownershipFilter) return false;
      if (typeFilter !== 'all' && unit.type !== typeFilter) return false;
      return true;
    });
  }, [accommodations, selectedFacilityId, ownershipFilter, typeFilter]);

  // Unique property types
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    accommodations.forEach(a => {
      if (a.type) set.add(a.type);
    });
    return Array.from(set);
  }, [accommodations]);

  // High-Level Portfolio Metrics
  const totalFacilities = filteredAccommodations.length;
  const ownedCount = filteredAccommodations.filter(a => a.ownership === 'Owned').length;
  const rentedCount = filteredAccommodations.filter(a => a.ownership === 'Rented').length;

  const totalBeds = filteredAccommodations.reduce((sum, a) => sum + (a.totalCapacityBeds || 0), 0);
  const totalRooms = filteredAccommodations.reduce((sum, a) => sum + (a.totalRooms || 0), 0);
  const totalOccupants = filteredAccommodations.reduce((sum, a) => sum + (a.occupantIds?.length || 0), 0);
  const totalVacantBeds = Math.max(0, totalBeds - totalOccupants);
  const globalOccupancyRate = totalBeds > 0 ? Math.round((totalOccupants / totalBeds) * 100) : 0;

  const totalMonthlyLease = filteredAccommodations
    .filter(a => a.ownership === 'Rented')
    .reduce((sum, a) => sum + calculateAccommodationMonthlyCost(a), 0);

  const filteredUtilities = useMemo(() => {
    if (selectedFacilityId === 'all') {
      const activeFacilityIds = new Set(filteredAccommodations.map(a => a.id));
      return utilities.filter(u => activeFacilityIds.has(u.accommodationId));
    }
    return utilities.filter(u => u.accommodationId === selectedFacilityId);
  }, [utilities, filteredAccommodations, selectedFacilityId]);

  const totalUtilitiesCost = filteredUtilities.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
  const totalOpsCost = totalMonthlyLease + totalUtilitiesCost;

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // Robust Multi-Page Vector jsPDF Report Engine
  // -------------------------------------------------------------
  const generatePdfBlob = async (): Promise<Blob> => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // Palette tokens
    const brandBlue: [number, number, number] = [11, 95, 255];    // #0B5FFF
    const darkNavy: [number, number, number] = [15, 23, 42];      // slate-900
    const slateMuted: [number, number, number] = [100, 116, 139]; // slate-500
    const cardBg: [number, number, number] = [248, 250, 252];      // slate-50
    const borderColor: [number, number, number] = [226, 232, 240]; // slate-200

    // 1. Top Accent & Header Bar
    doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Title inside banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SCEDIH ENTERPRISE FACILITIES MANAGEMENT', margin, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      selectedTemplate === 'detailed' 
        ? 'Detailed Facility Specifications & Housing Dossier'
        : selectedTemplate === 'roster'
        ? 'Resident Workforce Housing & Bed Allocation Roster'
        : selectedTemplate === 'utilities'
        ? 'Utilities, Operating Expenses & Lease Ledger'
        : 'Accommodation & Camp Operations Master Report',
      margin,
      38
    );

    // Reference ID & Classification
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL HOUSING RECORD', pageWidth - margin - 150, 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: CF-ACC-${new Date().toISOString().split('T')[0]}`, pageWidth - margin - 150, 38);

    // Sub-banner metadata
    let currentY = 68;
    doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(reportTitle, margin, currentY);

    currentY += 15;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      `Portfolio View: ${reportSubtitle}   |   Facilities: ${totalFacilities} (${ownedCount} Owned, ${rentedCount} Leased)   |   Total Beds: ${totalBeds}`,
      margin,
      currentY
    );

    currentY += 12;
    doc.text(
      `Generated: ${currentDateFormatted} at ${currentTimeFormatted}   |   Prepared By: ${preparedBy}   |   Currency: ZAR (R)`,
      margin,
      currentY
    );

    // 2. Executive KPI Cards Section (if toggled)
    if (includeKpiSummary) {
      currentY += 14;
      const cardHeight = 38;
      const cardGap = 8;
      const numCards = 5;
      const cardW = (contentWidth - cardGap * (numCards - 1)) / numCards;

      const kpis = [
        { label: 'REGISTERED FACILITIES', val: `${totalFacilities} Units`, sub: `${ownedCount} Owned • ${rentedCount} Leased`, color: brandBlue },
        { label: 'BED OCCUPANCY', val: `${totalOccupants} / ${totalBeds}`, sub: `${globalOccupancyRate}% (${totalVacantBeds} Vacant)`, color: [37, 99, 235] as [number, number, number] },
        { label: 'MONTHLY LEASE', val: `R ${(totalMonthlyLease / 1000).toFixed(1)}k`, sub: `R ${totalMonthlyLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}/mo`, color: [16, 185, 129] as [number, number, number] },
        { label: 'LOGGED UTILITIES', val: `R ${totalUtilitiesCost.toLocaleString('en-ZA')}`, sub: `${filteredUtilities.length} Bills Logged`, color: [217, 119, 6] as [number, number, number] },
        { label: 'TOTAL MONTHLY OPS', val: `R ${(totalOpsCost / 1000).toFixed(1)}k`, sub: `Lease + Utilities Cost`, color: [79, 70, 229] as [number, number, number] },
      ];

      kpis.forEach((kpi, idx) => {
        const x = margin + idx * (cardW + cardGap);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(x, currentY, cardW, cardHeight, 4, 4, 'FD');

        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.label, x + 6, currentY + 11);

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.val, x + 6, currentY + 23);

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(kpi.sub, x + 6, currentY + 33);
      });

      currentY += cardHeight + 14;
    } else {
      currentY += 14;
    }

    // -------------------------------------------------------------
    // TEMPLATE 1: Executive Master Summary
    // -------------------------------------------------------------
    if (selectedTemplate === 'executive') {
      const facilityRows = filteredAccommodations.map((unit, idx) => {
        const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
        const activeLease = calculateAccommodationMonthlyCost(unit);
        const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
        const unitUtilsCost = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
        const occPct = unit.totalCapacityBeds > 0 ? Math.round((occupants.length / unit.totalCapacityBeds) * 100) : 0;

        return [
          (idx + 1).toString(),
          `${unit.name}\n${unit.location}${unit.address ? ` • ${unit.address}` : ''}`,
          unit.ownership,
          unit.type,
          `${unit.totalRooms || 1} Rms\n${unit.totalCapacityBeds} Beds`,
          `${occupants.length} / ${unit.totalCapacityBeds} (${occPct}%)\n${Math.max(0, unit.totalCapacityBeds - occupants.length)} Vacant`,
          unit.ownership === 'Rented' ? `R ${activeLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n${unit.rentalRateType || 'Fixed'}` : 'Owned (R 0.00)',
          `R ${unitUtilsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}\n(${unitUtils.length} bills)`,
          `R ${(activeLease + unitUtilsCost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Facility & Location', 'Ownership', 'Type', 'Rooms/Beds', 'Occupancy', 'Monthly Lease', 'Utilities', 'Total Monthly']],
        body: facilityRows,
        theme: 'grid',
        headStyles: {
          fillColor: brandBlue,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 7,
          textColor: darkNavy,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        foot: [[
          'TOTAL',
          `${totalFacilities} Facilities Registered`,
          `${ownedCount} Owned / ${rentedCount} Leased`,
          '—',
          `${totalRooms} Rms / ${totalBeds} Beds`,
          `${totalOccupants} / ${totalBeds} (${globalOccupancyRate}%)`,
          `R ${totalMonthlyLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
          `R ${totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
          `R ${totalOpsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
        ]],
        footStyles: {
          fillColor: darkNavy,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 14;
    }

    // -------------------------------------------------------------
    // TEMPLATE 2: Detailed Facilities Dossier
    // -------------------------------------------------------------
    if (selectedTemplate === 'detailed') {
      filteredAccommodations.forEach((unit, uIdx) => {
        if (currentY > pageHeight - 160) {
          doc.addPage();
          currentY = margin + 10;
        }

        const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
        const activeLease = calculateAccommodationMonthlyCost(unit);
        const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
        const unitUtilsCost = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
        const occPct = unit.totalCapacityBeds > 0 ? Math.round((occupants.length / unit.totalCapacityBeds) * 100) : 0;

        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.text(`${uIdx + 1}. ${unit.name} (${unit.type} • ${unit.ownership})`, margin + 8, currentY + 14);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(`Location: ${unit.location} ${unit.address ? `• ${unit.address}` : ''}`, pageWidth - margin - 220, currentY + 14);

        currentY += 26;

        // Specs & Financial Summary row
        const specDetails = [
          ['Capacity & Rooms:', `${unit.totalRooms || 1} Rooms, ${unit.totalCapacityBeds} Total Beds`],
          ['Occupancy Status:', `${occupants.length} / ${unit.totalCapacityBeds} Beds (${occPct}% Occupied, ${Math.max(0, unit.totalCapacityBeds - occupants.length)} Vacant)`],
          ['Monthly Lease:', unit.ownership === 'Rented' ? `R ${activeLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${getAccommodationRateDescription(unit)})` : 'Company Owned (No Lease)'],
          ['Utilities Incurred:', `R ${unitUtilsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${unitUtils.length} bills logged)`],
          ['Landlord / Vendor:', unit.rentalVendor ? `${unit.rentalVendor} (Ref: ${unit.rentalAgreementNumber || 'N/A'})` : 'Internal Facilities'],
          ['Amenities & Features:', (unit.amenities || ['Power', 'Water', 'Standard Facilities']).join(', ')]
        ];

        autoTable(doc, {
          startY: currentY,
          head: [['Parameter', 'Specification & Operating Detail']],
          body: specDetails,
          theme: 'grid',
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7
          },
          bodyStyles: {
            fontSize: 7,
            textColor: darkNavy,
            cellPadding: 2
          },
          columnStyles: {
            0: { cellWidth: 130, fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // Resident Personnel Table for this Unit
        if (occupants.length > 0) {
          const occRows = occupants.map((emp, oIdx) => [
            (oIdx + 1).toString(),
            emp.id,
            `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.id,
            emp.position || (emp as any).role || 'Staff',
            emp.department || 'Operations',
            emp.accommodationDetails?.roomNumber || '—',
            emp.phone || '—'
          ]);

          autoTable(doc, {
            startY: currentY,
            head: [['#', 'Emp ID', 'Allocated Staff Name', 'Role / Trade', 'Department', 'Room #', 'Contact']],
            body: occRows,
            theme: 'grid',
            headStyles: {
              fillColor: [16, 185, 129],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 6.5
            },
            bodyStyles: {
              fontSize: 6.5,
              textColor: darkNavy,
              cellPadding: 2
            },
            margin: { left: margin, right: margin }
          });

          currentY = (doc as any).lastAutoTable.finalY + 14;
        }
      });
    }

    // -------------------------------------------------------------
    // TEMPLATE 3 & Roster: Resident Staff Housing Roster
    // -------------------------------------------------------------
    if (selectedTemplate === 'roster' || (includeResidentRoster && selectedTemplate === 'executive')) {
      if (employees.length > 0) {
        if (currentY > pageHeight - 120) {
          doc.addPage();
          currentY = margin + 10;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.text('Resident Personnel & Housing Allocation Roster', margin, currentY);
        currentY += 5;

        const rosterRows: string[][] = [];
        filteredAccommodations.forEach(unit => {
          const unitOccupants = employees.filter(e => unit.occupantIds?.includes(e.id));
          unitOccupants.forEach(emp => {
            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
            rosterRows.push([
              emp.id,
              fullName,
              emp.position || (emp as any).role || 'General Worker',
              emp.department || 'Operations',
              unit.name,
              emp.accommodationDetails?.roomNumber || '—',
              emp.accommodationDetails?.checkInDate || unit.createdAt || '—',
              emp.phone || '—'
            ]);
          });
        });

        if (rosterRows.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [['Emp ID', 'Staff Name', 'Role / Trade', 'Department', 'Facility Assigned', 'Room #', 'Check-in Date', 'Contact']],
            body: rosterRows,
            theme: 'grid',
            headStyles: {
              fillColor: [79, 70, 229],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7
            },
            bodyStyles: {
              fontSize: 6.5,
              textColor: darkNavy,
              cellPadding: 2.5
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252]
            },
            margin: { left: margin, right: margin }
          });

          currentY = (doc as any).lastAutoTable.finalY + 14;
        }
      }
    }

    // -------------------------------------------------------------
    // TEMPLATE 4 & Utilities: Utilities & Running Expenses Ledger
    // -------------------------------------------------------------
    if (selectedTemplate === 'utilities' || (includeUtilitiesBreakdown && selectedTemplate === 'executive')) {
      if (filteredUtilities.length > 0) {
        if (currentY > pageHeight - 120) {
          doc.addPage();
          currentY = margin + 10;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.text(`Utility Bills & Running Expenses Ledger (Total: R ${totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})`, margin, currentY);
        currentY += 5;

        const utilityRows = filteredUtilities.map(u => {
          const unit = accommodations.find(a => a.id === u.accommodationId);
          return [
            u.date,
            unit?.name || u.accommodationId,
            u.roomNumber || 'Entire Facility',
            u.utilityType,
            u.unitsConsumed ? `${u.unitsConsumed} ${u.unitLabel || 'Units'}` : '—',
            u.vendorOrProvider || '—',
            u.invoiceOrReceiptNumber || '—',
            `R ${u.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`,
            u.paidStatus
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Date', 'Facility', 'Area / Room', 'Utility Category', 'Consumed', 'Vendor / Provider', 'Receipt #', 'Amount (ZAR)', 'Status']],
          body: utilityRows,
          theme: 'grid',
          headStyles: {
            fillColor: [217, 119, 6],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7
          },
          bodyStyles: {
            fontSize: 6.5,
            textColor: darkNavy,
            cellPadding: 2.5
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 14;
      }
    }

    // -------------------------------------------------------------
    // Sign-off & Management Authorization Block
    // -------------------------------------------------------------
    if (includeSignoff) {
      if (currentY > pageHeight - 90) {
        doc.addPage();
        currentY = margin + 10;
      }

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
      doc.text('MANAGEMENT SIGN-OFF & OPERATIONAL AUTHORIZATION', margin, currentY);
      currentY += 10;

      const sigBoxWidth = (contentWidth - 24) / 3;
      const sigHeight = 40;

      const sigRoles = [
        { title: 'CAMP SUPERVISOR', name: preparedBy },
        { title: 'FACILITIES & HOUSING MANAGER', name: 'Authorized Facilities Representative' },
        { title: 'PROJECT OPERATIONS DIRECTOR', name: 'Executive Project Director' }
      ];

      sigRoles.forEach((role, i) => {
        const sx = margin + i * (sigBoxWidth + 12);
        doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(sx, currentY, sigBoxWidth, sigHeight, 3, 3, 'FD');

        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
        doc.text(role.title, sx + 6, currentY + 10);

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
        doc.text(`Name: ${role.name}`, sx + 6, currentY + 20);
        doc.text(`Sign: ___________________  Date: ${currentDateFormatted}`, sx + 6, currentY + 32);
      });
    }

    // Footer on all pages
    const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : (doc.internal.pages.length - 1);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
      doc.text(
        'Scedih Facilities Management • Confidential Operational Housing Record',
        margin,
        pageHeight - 8
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    }

    return doc.output('blob');
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      const filename = `Constructfield_Accommodation_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      saveOrShareFile({
        filename,
        blob,
        title: 'Accommodation Operations Master Statement',
        text: 'Constructfield Accommodation & Housing Operations Report'
      });
    } catch (err) {
      console.error('Failed to generate accommodation PDF:', err);
      alert('Unable to generate Accommodation PDF. Please check data and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden print-modal-wrapper animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-[#0B5FFF]">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Accommodation & Camp Hub Print Engine
                </h2>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-bold text-[10px]">
                  {filteredAccommodations.length} Facilities • {totalBeds} Beds
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live interactive print preview, report styling, filters, and high-resolution PDF generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'config'
                    ? 'bg-white dark:bg-slate-900 text-[#0B5FFF] dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" /> Configure
              </button>
            </div>

            <Button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="gap-2 bg-[#0B5FFF] hover:bg-blue-600 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
            >
              <Download className="h-4 w-4" />
              <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
            </Button>

            <Button
              onClick={handlePrint}
              disabled={isGenerating}
              variant="outline"
              className="hidden md:flex gap-1.5 text-xs h-9 rounded-xl border-slate-200 dark:border-slate-700 font-semibold"
            >
              <Printer className="h-4 w-4" /> Print Now
            </Button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden print-modal-body">
          
          {/* Left Sidebar: Controls & Config (Hidden during print) */}
          <div className={`w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-y-auto space-y-5 no-print ${activeTab === 'config' ? 'block' : 'hidden md:block'}`}>
            
            {/* Report Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#0B5FFF]" /> Report Template
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'executive', name: 'Executive Master Summary', desc: 'KPI cards, occupancy rates & financial summary' },
                  { id: 'detailed', name: 'Detailed Facilities Dossier', desc: 'Unit specs, amenities, lease terms & resident roster' },
                  { id: 'roster', name: 'Resident Housing Roster', desc: 'Workforce bed allocations, rooms & check-in dates' },
                  { id: 'utilities', name: 'Utilities & Expense Ledger', desc: 'Electricity, water, WiFi & running costs logs' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as AccommodationReportTemplateType)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedTemplate === t.id
                        ? 'border-[#0B5FFF] bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{t.name}</span>
                      {selectedTemplate === t.id && <Check className="h-3.5 w-3.5 text-[#0B5FFF]" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope & Property Filters */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-slate-500" /> Filter Facilities
              </label>
              
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Facility</label>
                <select
                  value={selectedFacilityId}
                  onChange={e => setSelectedFacilityId(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Facilities ({accommodations.length})</option>
                  {accommodations.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.location})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Ownership</label>
                <select
                  value={ownershipFilter}
                  onChange={e => setOwnershipFilter(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Ownership Types</option>
                  <option value="Owned">Owned Only ({accommodations.filter(a => a.ownership === 'Owned').length})</option>
                  <option value="Rented">Rented / Leased Only ({accommodations.filter(a => a.ownership === 'Rented').length})</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Property Type</label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="all">All Property Types</option>
                  {uniqueTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Include Sections
              </label>
              
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeKpiSummary}
                  onChange={e => setIncludeKpiSummary(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Executive KPI Summary Cards</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeResidentRoster}
                  onChange={e => setIncludeResidentRoster(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Resident Staff Housing Roster</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUtilitiesBreakdown}
                  onChange={e => setIncludeUtilitiesBreakdown(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Utilities & Running Expenses</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignoff}
                  onChange={e => setIncludeSignoff(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B5FFF] focus:ring-[#0B5FFF]"
                />
                <span>Management Sign-off & Approvals</span>
              </label>
            </div>

            {/* Custom Report Headers */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Report Metadata
              </label>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500">Prepared By</label>
                <input
                  type="text"
                  value={preparedBy}
                  onChange={e => setPreparedBy(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Right Main Area: Live Document Visual Preview */}
          <div className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-200/70 dark:bg-slate-950 flex justify-center items-start ${activeTab === 'preview' ? 'block' : 'hidden md:block'}`}>
            <div 
              ref={printRef}
              className="bg-white text-slate-900 rounded-xl shadow-xl w-full max-w-4xl p-6 sm:p-8 space-y-6 border border-slate-200/80 min-h-[700px] print-content-container"
            >
              
              {/* Document Branded Header Bar */}
              <div className="border-b-2 border-[#0B5FFF] pb-4 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0B5FFF] text-white px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
                      CONSTRUCTFIELD
                    </span>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {reportTitle}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-600">
                    Portfolio View: <strong className="text-slate-900">{reportSubtitle}</strong> &nbsp;|&nbsp; Facilities: <strong className="text-slate-900">{totalFacilities} ({ownedCount} Owned, {rentedCount} Leased)</strong> &nbsp;|&nbsp; Bed Capacity: <strong className="text-slate-900">{totalOccupants} / {totalBeds} ({globalOccupancyRate}% Occupied)</strong>
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 shrink-0">
                  <div className="font-bold text-slate-700">{currentDateFormatted}</div>
                  <div className="text-[10px] text-slate-400 font-mono">CF-ACC-MASTER</div>
                </div>
              </div>

              {/* KPI Summary Grid (if enabled) */}
              {includeKpiSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Facilities</div>
                    <div className="text-base font-black text-[#0B5FFF]">{totalFacilities} Units</div>
                    <div className="text-[9px] text-slate-400">{ownedCount} Owned • {rentedCount} Leased</div>
                  </div>
                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-center">
                    <div className="text-[9px] font-bold text-blue-600 uppercase">Bed Capacity</div>
                    <div className="text-base font-black text-blue-700">{totalOccupants} / {totalBeds}</div>
                    <div className="text-[9px] text-blue-500 font-medium">{globalOccupancyRate}% ({totalVacantBeds} Vacant)</div>
                  </div>
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-center">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase">Monthly Lease</div>
                    <div className="text-base font-black text-emerald-700">R {(totalMonthlyLease / 1000).toFixed(1)}k</div>
                    <div className="text-[9px] text-emerald-600 font-medium">R {totalMonthlyLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}/mo</div>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-center">
                    <div className="text-[9px] font-bold text-amber-600 uppercase">Utilities Cost</div>
                    <div className="text-base font-black text-amber-700">R {totalUtilitiesCost.toLocaleString('en-ZA')}</div>
                    <div className="text-[9px] text-amber-600 font-medium">{filteredUtilities.length} Bills Logged</div>
                  </div>
                  <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100 text-center col-span-2 sm:col-span-1">
                    <div className="text-[9px] font-bold text-indigo-600 uppercase">Total Monthly Ops</div>
                    <div className="text-base font-black text-indigo-700">R {(totalOpsCost / 1000).toFixed(1)}k</div>
                    <div className="text-[9px] text-indigo-500 font-medium">Lease + Utilities</div>
                  </div>
                </div>
              )}

              {/* VIEW 1: Facilities Master Directory & Financial Summary Table */}
              {(selectedTemplate === 'executive') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-[#0B5FFF]" />
                      Facilities Master Directory & Financial Breakdown
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">{filteredAccommodations.length} properties in scope</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                          <th className="p-2.5 w-8">#</th>
                          <th className="p-2.5">Facility & Location</th>
                          <th className="p-2.5 w-20">Ownership</th>
                          <th className="p-2.5 w-28">Type</th>
                          <th className="p-2.5 w-24">Rooms/Beds</th>
                          <th className="p-2.5 w-28">Occupancy</th>
                          <th className="p-2.5 w-28">Monthly Lease</th>
                          <th className="p-2.5 w-20">Utilities</th>
                          <th className="p-2.5 w-24 text-right">Total Monthly</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredAccommodations.map((unit, idx) => {
                          const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
                          const activeLease = calculateAccommodationMonthlyCost(unit);
                          const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
                          const unitUtilsCost = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
                          const occPct = unit.totalCapacityBeds > 0 ? Math.round((occupants.length / unit.totalCapacityBeds) * 100) : 0;

                          return (
                            <tr key={unit.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{unit.name}</div>
                                <div className="text-[10px] text-slate-400">{unit.location}</div>
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  unit.ownership === 'Owned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {unit.ownership}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600">{unit.type}</td>
                              <td className="p-2.5 font-medium">{unit.totalRooms || 1} Rms • {unit.totalCapacityBeds} Beds</td>
                              <td className="p-2.5">
                                <div className="font-semibold">{occupants.length} / {unit.totalCapacityBeds} ({occPct}%)</div>
                                <div className="text-[10px] text-slate-400">{Math.max(0, unit.totalCapacityBeds - occupants.length)} vacant</div>
                              </td>
                              <td className="p-2.5 font-semibold text-slate-900">
                                {unit.ownership === 'Rented' ? `R ${activeLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'Owned'}
                              </td>
                              <td className="p-2.5 text-slate-700">R {unitUtilsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                              <td className="p-2.5 font-bold text-[#0B5FFF] text-right">R {(activeLease + unitUtilsCost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-bold text-[10px]">
                          <td className="p-2.5" colSpan={4}>PORTFOLIO TOTALS ({totalFacilities} Facilities)</td>
                          <td className="p-2.5">{totalRooms} Rms • {totalBeds} Beds</td>
                          <td className="p-2.5">{totalOccupants} / {totalBeds} ({globalOccupancyRate}%)</td>
                          <td className="p-2.5">R {totalMonthlyLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5">R {totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-emerald-300 text-right">R {totalOpsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 2: Detailed Facilities Dossier */}
              {selectedTemplate === 'detailed' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#0B5FFF]" />
                    Detailed Facilities Specifications & Dossiers
                  </h3>

                  <div className="space-y-4">
                    {filteredAccommodations.map((unit, idx) => {
                      const occupants = employees.filter(e => unit.occupantIds?.includes(e.id));
                      const activeLease = calculateAccommodationMonthlyCost(unit);
                      const unitUtils = utilities.filter(u => u.accommodationId === unit.id);
                      const unitUtilsCost = unitUtils.reduce((sum, u) => sum + (u.amountZAR || 0), 0);
                      const occPct = unit.totalCapacityBeds > 0 ? Math.round((occupants.length / unit.totalCapacityBeds) * 100) : 0;

                      return (
                        <div key={unit.id} className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#0B5FFF] text-white text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900">{unit.name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                unit.ownership === 'Owned' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {unit.ownership}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">{unit.type}</span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              <span>{unit.location} {unit.address ? `• ${unit.address}` : ''}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-semibold">Capacity</div>
                              <div className="font-bold text-slate-900 mt-0.5">{unit.totalRooms || 1} Rooms • {unit.totalCapacityBeds} Beds</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-semibold">Occupancy</div>
                              <div className="font-bold text-blue-700 mt-0.5">{occupants.length} / {unit.totalCapacityBeds} ({occPct}%)</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-semibold">Monthly Lease</div>
                              <div className="font-bold text-emerald-700 mt-0.5">
                                {unit.ownership === 'Rented' ? `R ${activeLease.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : 'Owned (R 0)'}
                              </div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <div className="text-[10px] text-slate-500 font-semibold">Logged Utilities</div>
                              <div className="font-bold text-amber-700 mt-0.5">R {unitUtilsCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </div>

                          {unit.amenities && unit.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-500 font-bold self-center mr-1">Amenities:</span>
                              {unit.amenities.map(am => (
                                <span key={am} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-700 font-medium">
                                  {am}
                                </span>
                              ))}
                            </div>
                          )}

                          {occupants.length > 0 && (
                            <div className="pt-2 border-t border-slate-200">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Allocated Resident Personnel ({occupants.length})
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {occupants.map(emp => (
                                  <div key={emp.id} className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                    <div>
                                      <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                                      <div className="text-[10px] text-slate-500">{emp.position || (emp as any).role || 'Staff'} • {emp.id}</div>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold">
                                      Rm {emp.accommodationDetails?.roomNumber || '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* VIEW 3: Resident Staff Housing Roster Table */}
              {(selectedTemplate === 'roster' || (includeResidentRoster && selectedTemplate === 'executive')) && employees.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Resident Personnel & Housing Allocation Roster ({totalOccupants} Allocated Personnel)
                    </h3>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-900 font-bold text-[10px] uppercase border-b border-slate-200">
                          <th className="p-2 w-16">Emp ID</th>
                          <th className="p-2">Staff Name</th>
                          <th className="p-2 w-32">Role / Trade</th>
                          <th className="p-2 w-24">Department</th>
                          <th className="p-2 w-32">Facility</th>
                          <th className="p-2 w-16">Room #</th>
                          <th className="p-2 w-24">Check-in</th>
                          <th className="p-2 w-24">Contact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredAccommodations.flatMap(unit => {
                          const unitOccupants = employees.filter(e => unit.occupantIds?.includes(e.id));
                          return unitOccupants.map(emp => {
                            const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || (emp as any).name || emp.id;
                            return (
                              <tr key={`${unit.id}-${emp.id}`} className="hover:bg-slate-50/60">
                                <td className="p-2 font-mono font-bold text-slate-500 text-[11px]">{emp.id}</td>
                                <td className="p-2 font-bold text-slate-900">{fullName}</td>
                                <td className="p-2 text-slate-600">{emp.position || (emp as any).role || 'Staff'}</td>
                                <td className="p-2 text-slate-500">{emp.department || 'Operations'}</td>
                                <td className="p-2 font-medium text-indigo-700">{unit.name}</td>
                                <td className="p-2 font-mono">{emp.accommodationDetails?.roomNumber || '—'}</td>
                                <td className="p-2 text-slate-500">{emp.accommodationDetails?.checkInDate || unit.createdAt || '—'}</td>
                                <td className="p-2 text-slate-500">{emp.phone || '—'}</td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 4: Utilities & Operating Expenses Ledger Table */}
              {(selectedTemplate === 'utilities' || (includeUtilitiesBreakdown && selectedTemplate === 'executive')) && filteredUtilities.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-600" />
                      Logged Utilities & Running Expenses Ledger (Total: R {totalUtilitiesCost.toLocaleString('en-ZA', { minimumFractionDigits: 2 })})
                    </h3>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-amber-50 text-amber-900 font-bold text-[10px] uppercase border-b border-slate-200">
                          <th className="p-2 w-20">Date</th>
                          <th className="p-2 w-32">Facility</th>
                          <th className="p-2 w-24">Area / Room</th>
                          <th className="p-2 w-24">Category</th>
                          <th className="p-2 w-24">Consumed</th>
                          <th className="p-2">Vendor / Provider</th>
                          <th className="p-2 w-24">Receipt #</th>
                          <th className="p-2 w-24 text-right">Amount (ZAR)</th>
                          <th className="p-2 w-16 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredUtilities.map(u => {
                          const unit = accommodations.find(a => a.id === u.accommodationId);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60">
                              <td className="p-2 font-mono text-slate-500 text-[11px]">{u.date}</td>
                              <td className="p-2 font-medium text-slate-900">{unit?.name || u.accommodationId}</td>
                              <td className="p-2 text-slate-500">{u.roomNumber || 'Entire Facility'}</td>
                              <td className="p-2 font-bold text-amber-700">{u.utilityType}</td>
                              <td className="p-2">{u.unitsConsumed ? `${u.unitsConsumed} ${u.unitLabel || 'Units'}` : '—'}</td>
                              <td className="p-2 text-slate-500">{u.vendorOrProvider || '—'}</td>
                              <td className="p-2 font-mono text-[11px]">{u.invoiceOrReceiptNumber || '—'}</td>
                              <td className="p-2 font-bold text-slate-900 text-right">R {u.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                              <td className="p-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                  u.paidStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {u.paidStatus}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sign-off Signature Preview Block */}
              {includeSignoff && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Facilities Management Verification & Operational Sign-Off
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    I confirm that the recorded facility capacities, workforce bed allocations, and utility expenses represented in this report reflect the verified camp situation.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-800">
                    <div>Authorized Signature: ___________________________ ({preparedBy})</div>
                    <div>Facilities Verification: ___________________________</div>
                    <div className="sm:text-right">Date: {currentDateFormatted}</div>
                  </div>
                </div>
              )}

              {/* Running Footer */}
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <div>Constructfield OS Facilities Management • Master Housing & Camp Operations Record • Confidential</div>
                <div>Page 1 of 1 (Live Preview)</div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
