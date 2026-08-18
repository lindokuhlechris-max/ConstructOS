import * as XLSX from 'xlsx';
import { Activity, Project, SubTask } from '../types';
import { saveOrShareFile } from './fileExportService';

/**
 * Calculates optimal column widths based on cell content length
 */
function calculateColumnWidths(data: (string | number | boolean | null | undefined)[][]): XLSX.ColInfo[] {
  if (!data || data.length === 0) return [];
  const colCount = Math.max(...data.map(row => (row ? row.length : 0)));
  const widths: XLSX.ColInfo[] = [];

  for (let c = 0; c < colCount; c++) {
    let maxLen = 8;
    for (let r = 0; r < data.length; r++) {
      const val = data[r]?.[c];
      if (val !== undefined && val !== null) {
        const lines = String(val).split('\n');
        for (const line of lines) {
          if (line.length > maxLen) {
            maxLen = line.length;
          }
        }
      }
    }
    // Cap column width between 10 and 55 characters for clean readability
    widths.push({ wch: Math.min(Math.max(maxLen + 3, 11), 55) });
  }

  return widths;
}

/**
 * Generates an executive, beautifully structured multi-tab Excel Workbook (.xlsx)
 * capturing all comprehensive Activity data for professional reporting.
 */
export async function exportActivitiesToExcel(
  activities: Activity[],
  projects: Project[],
  filenameSuffix?: string
): Promise<boolean> {
  const getProjectName = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : (projId || 'General Project');
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date().toISOString().split('T')[0];

  // -------------------------------------------------------------
  // 1. High-Level Metrics & KPIs
  // -------------------------------------------------------------
  const total = activities.length;
  const inProgress = activities.filter(a => a.status === 'In Progress').length;
  const completed = activities.filter(a => a.status === 'Completed').length;
  const blocked = activities.filter(a => a.status === 'Blocked' || a.status === 'Waiting' || a.status === 'Cancelled').length;
  const notStarted = activities.filter(a => a.status === 'Not Started' || a.status === 'Ready').length;
  const avgProgress = total > 0 
    ? Math.round(activities.reduce((acc, a) => acc + (a.progress || 0), 0) / total) 
    : 0;

  const totalPlannedHours = activities.reduce((acc, a) => acc + (Number(a.plannedHours) || 0), 0);
  const totalActualHours = activities.reduce((acc, a) => acc + (Number(a.actualHours) || 0), 0);
  const totalTargetQty = activities.reduce((acc, a) => acc + (Number(a.targetQuantity) || 0), 0);
  const totalActualQty = activities.reduce((acc, a) => acc + (Number(a.actualQuantity) || 0), 0);

  // Group by discipline
  const disciplineMap = new Map<string, { total: number; completed: number; inProgress: number; progressSum: number }>();
  activities.forEach(a => {
    const disc = a.discipline || 'General Civil';
    const entry = disciplineMap.get(disc) || { total: 0, completed: 0, inProgress: 0, progressSum: 0 };
    entry.total++;
    if (a.status === 'Completed') entry.completed++;
    if (a.status === 'In Progress') entry.inProgress++;
    entry.progressSum += a.progress || 0;
    disciplineMap.set(disc, entry);
  });

  // Group by priority
  const priorityMap = new Map<string, { total: number; completed: number; progressSum: number }>();
  ['Critical', 'High', 'Medium', 'Low'].forEach(p => priorityMap.set(p, { total: 0, completed: 0, progressSum: 0 }));
  activities.forEach(a => {
    const prio = a.priority || 'Medium';
    const entry = priorityMap.get(prio) || { total: 0, completed: 0, progressSum: 0 };
    entry.total++;
    if (a.status === 'Completed') entry.completed++;
    entry.progressSum += a.progress || 0;
    priorityMap.set(prio, entry);
  });

  // -------------------------------------------------------------
  // TAB 1: EXECUTIVE SUMMARY
  // -------------------------------------------------------------
  const summaryRows: any[][] = [
    ['CONSTRUCTFIELD ENTERPRISE — ACTIVITIES & FIELD OPERATIONS MASTER REPORT'],
    ['Generated on:', `${currentDate} at ${currentTime}`, '', 'Report Scope:', filenameSuffix ? filenameSuffix.toUpperCase() : 'ALL ACTIVE ACTIVITIES'],
    ['Total Records:', total, '', 'Weighted Progress:', `${avgProgress}%`],
    [''],
    ['1. KEY EXECUTION METRICS (KPIS)', 'COUNT / VALUE', 'PERCENTAGE / STATUS', 'NOTES & TARGETING'],
    ['Total Scheduled Activities', total, '100%', 'Total task records in active filter'],
    ['Completed Activities', completed, `${total > 0 ? Math.round((completed / total) * 100) : 0}%`, 'Sign-off and verified done'],
    ['In Progress Activities', inProgress, `${total > 0 ? Math.round((inProgress / total) * 100) : 0}%`, 'Active physical production on site'],
    ['Blocked / Delayed Tasks', blocked, `${total > 0 ? Math.round((blocked / total) * 100) : 0}%`, 'Requires supervisor intervention'],
    ['Not Started / Ready Tasks', notStarted, `${total > 0 ? Math.round((notStarted / total) * 100) : 0}%`, 'Awaiting scheduled start window'],
    ['Average Activity Progress', `${avgProgress}%`, 'Overall Mean', 'Average physical completion rate'],
    ['Total Planned Labour Hours', totalPlannedHours, 'hrs', 'Baseline planned schedule duration'],
    ['Total Actual Logged Hours', totalActualHours, 'hrs', `Variance: ${totalActualHours - totalPlannedHours} hrs`],
    ['Total Target Quantity Output', totalTargetQty, 'units', 'Planned engineering units of work'],
    ['Total Actual Quantity Achieved', totalActualQty, 'units', `${totalTargetQty > 0 ? Math.round((totalActualQty / totalTargetQty) * 100) : 0}% physical deliverable achieved`],
    [''],
    ['2. DISCIPLINE & WORKSTREAM BREAKDOWN', 'TOTAL TASKS', 'COMPLETED', 'IN PROGRESS', 'AVG PROGRESS %'],
  ];

  disciplineMap.forEach((data, disc) => {
    summaryRows.push([
      disc,
      data.total,
      data.completed,
      data.inProgress,
      `${data.total > 0 ? Math.round(data.progressSum / data.total) : 0}%`
    ]);
  });

  summaryRows.push(['']);
  summaryRows.push(['3. PRIORITY LEVEL DISTRIBUTION', 'TOTAL TASKS', 'COMPLETED', 'AVG PROGRESS %', 'CRITICALITY']);
  priorityMap.forEach((data, prio) => {
    if (data.total > 0) {
      summaryRows.push([
        prio,
        data.total,
        data.completed,
        `${data.total > 0 ? Math.round(data.progressSum / data.total) : 0}%`,
        prio === 'Critical' ? 'HIGH ATTENTION REQUIRED' : prio === 'High' ? 'PRIORITY PRODUCTION' : 'STANDARD WORKFLOW'
      ]);
    }
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = calculateColumnWidths(summaryRows);

  // -------------------------------------------------------------
  // TAB 2: ACTIVITIES MASTER
  // -------------------------------------------------------------
  const masterHeaders = [
    'Activity ID',
    'Activity Name',
    'Project ID',
    'Project Name',
    'Discipline',
    'Workstream',
    'Work Package',
    'Area / Location',
    'Section Span / Chainage',
    'Priority',
    'Status',
    'Progress %',
    'Target Quantity',
    'Actual Quantity',
    'Unit of Measure',
    'Daily Target Qty',
    'Daily Target %',
    'Start Date',
    'Finish Date',
    'Assigned Lead / Team',
    'Site Supervisor',
    'Planned Hours',
    'Actual Hours',
    'Hour Variance',
    'Total Subtasks',
    'Completed Subtasks',
    'Subtask Progress %',
    'QA Hold Points',
    'Milestones Count',
    'Scope Description',
    'Method Statement',
    'Remarks & Constraints'
  ];

  const masterRows = activities.map(a => {
    const subtasks = a.subtasks || [];
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(s => s.status === 'Completed').length;
    const subtaskPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
    const qaHoldPoints = subtasks.filter(s => s.isHoldPoint).length;
    const milestones = subtasks.filter(s => s.isMilestone).length;
    const plannedHrs = Number(a.plannedHours) || 0;
    const actualHrs = Number(a.actualHours) || 0;

    return [
      a.id,
      a.name,
      a.projectId || '',
      getProjectName(a.projectId || ''),
      a.discipline || 'General Civil',
      a.workstream || 'PTS_CONSTRUCTION',
      a.workPackage || '',
      a.area || a.location || '',
      a.sectionSpan || a.chainage || (a.chainageStart ? `${a.chainageStart} - ${a.chainageEnd || ''}` : ''),
      a.priority || 'Medium',
      a.status || 'Not Started',
      `${a.progress || 0}%`,
      a.targetQuantity ?? 0,
      a.actualQuantity ?? 0,
      a.unit || 'units',
      a.dailyTargetQuantity ?? '',
      a.dailyTargetPercentage ? `${a.dailyTargetPercentage}%` : '',
      a.startDate || '',
      a.finishDate || '',
      a.assignedTo || 'General Operations',
      a.supervisor || 'Site Engineer',
      plannedHrs,
      actualHrs,
      actualHrs - plannedHrs,
      totalSubtasks,
      completedSubtasks,
      `${subtaskPct}%`,
      qaHoldPoints,
      milestones,
      a.description || '',
      a.methodStatement || '',
      a.remarks || (a.constraints && a.constraints.length > 0 ? a.constraints.join('; ') : '')
    ];
  });

  const masterData = [masterHeaders, ...masterRows];
  const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
  wsMaster['!cols'] = calculateColumnWidths(masterData);

  // -------------------------------------------------------------
  // TAB 3: SUBTASKS & QA HOLD POINTS
  // -------------------------------------------------------------
  const subtaskHeaders = [
    'Activity ID',
    'Parent Activity Name',
    'Discipline',
    'Subtask ID',
    'Subtask Title / Deliverable',
    'Status',
    'Progress %',
    'Target Output',
    'Actual Output',
    'Unit',
    'Weight %',
    'Assigned To',
    'Predecessor ID',
    'Is Milestone?',
    'Milestone Criteria',
    'Is QA Hold Point?',
    'QA Sign-Off Status',
    'QA Inspector',
    'QA Sign-Off Date',
    'Survey Section / Chainage',
    'Notes & Explainer'
  ];

  const subtaskRows: any[][] = [];
  activities.forEach(a => {
    if (a.subtasks && a.subtasks.length > 0) {
      a.subtasks.forEach(s => {
        const targetQ = s.targetQuantity ?? 0;
        const completedQ = s.completedQuantity ?? 0;
        const prog = targetQ > 0 ? Math.round((completedQ / targetQ) * 100) : (s.status === 'Completed' ? 100 : s.status === 'In Progress' ? 50 : 0);

        subtaskRows.push([
          a.id,
          a.name,
          a.discipline || 'General',
          s.id,
          s.title,
          s.status || 'Not Started',
          `${prog}%`,
          s.targetQuantity ?? '',
          s.completedQuantity ?? '',
          s.unit || a.unit || '',
          '',
          s.assignedPerson || s.assignedTeam || a.assignedTo || '',
          s.predecessorId || '',
          s.isMilestone ? 'YES' : 'NO',
          s.milestoneCriteria || '',
          s.isHoldPoint ? 'YES (HOLD POINT)' : 'NO',
          s.holdPointSignOff?.approved ? 'Approved & Signed' : (s.isHoldPoint ? 'Pending Inspection' : 'N/A'),
          s.holdPointSignOff?.signedBy || '',
          s.holdPointSignOff?.signedAt || '',
          s.sectionSpan || s.chainage || '',
          s.notes || ''
        ]);
      });
    }
  });

  const subtaskData = [subtaskHeaders, ...(subtaskRows.length > 0 ? subtaskRows : [['No subtasks recorded for the selected activities']])];
  const wsSubtasks = XLSX.utils.aoa_to_sheet(subtaskData);
  wsSubtasks['!cols'] = calculateColumnWidths(subtaskData);

  // -------------------------------------------------------------
  // TAB 4: RESOURCE ASSIGNMENTS (Labour, Materials & Equipment)
  // -------------------------------------------------------------
  const resourceHeaders = [
    'Activity ID',
    'Activity Name',
    'Resource Category',
    'Resource ID / Code',
    'Resource Description / Role',
    'Allocated Qty / Hours',
    'Unit / Reference',
    'Assignment Start Date',
    'Notes / Assignment Info'
  ];

  const resourceRows: any[][] = [];
  activities.forEach(a => {
    // 1. Labour assignments
    if (a.assignedLabour && a.assignedLabour.length > 0) {
      a.assignedLabour.forEach(l => {
        resourceRows.push([
          a.id,
          a.name,
          'Labour Workforce',
          l.employeeId || l.id || 'LAB-01',
          `${l.name} (${l.role || 'Artisan'})`,
          l.hours || 0,
          'Hours',
          l.startDate || '',
          l.notes || 'Allocated Labour'
        ]);
      });
    }

    // 2. Material assignments
    if (a.assignedMaterials && a.assignedMaterials.length > 0) {
      a.assignedMaterials.forEach(m => {
        resourceRows.push([
          a.id,
          a.name,
          'Material Inventory',
          m.materialId || m.id || 'MAT-01',
          m.name || 'Allocated Material',
          m.quantity || 0,
          m.unit || 'units',
          m.assignedDate || '',
          m.notes || ''
        ]);
      });
    }

    // 3. Equipment assignments
    if (a.assignedEquipment && a.assignedEquipment.length > 0) {
      a.assignedEquipment.forEach(e => {
        resourceRows.push([
          a.id,
          a.name,
          'Plant & Equipment',
          e.equipmentId || e.id || 'EQ-01',
          `${e.name}${e.operator ? ` (Operator: ${e.operator})` : ''}`,
          1,
          'Unit Plant',
          e.startDate || '',
          e.notes || ''
        ]);
      });
    }
  });

  const resourceData = [
    resourceHeaders,
    ...(resourceRows.length > 0 ? resourceRows : [['No direct resource allocations assigned']])
  ];
  const wsResources = XLSX.utils.aoa_to_sheet(resourceData);
  wsResources['!cols'] = calculateColumnWidths(resourceData);

  // -------------------------------------------------------------
  // TAB 5: SURVEY SPANS & SECTION LINKAGES
  // -------------------------------------------------------------
  const surveyHeaders = [
    'Activity ID',
    'Activity Name',
    'Workstream',
    'Section / PTS Span',
    'Chainage Start',
    'Chainage End',
    'Physical Target Quantity',
    'Completed Output',
    'Unit',
    'Progress %',
    'Assigned Team',
    'Status'
  ];

  const surveyRows = activities
    .filter(a => a.sectionSpan || a.chainage || a.chainageStart || a.workstream === 'SURVEYING')
    .map(a => [
      a.id,
      a.name,
      a.workstream || 'PTS_CONSTRUCTION',
      a.sectionSpan || a.chainage || '—',
      a.chainageStart || '—',
      a.chainageEnd || '—',
      a.targetQuantity ?? 0,
      a.actualQuantity ?? 0,
      a.unit || 'm',
      `${a.progress || 0}%`,
      a.assignedTo || 'Survey Crew',
      a.status || 'Not Started'
    ]);

  const surveyData = [
    surveyHeaders,
    ...(surveyRows.length > 0 ? surveyRows : [['No specialized survey chainage spans linked']])
  ];
  const wsSurvey = XLSX.utils.aoa_to_sheet(surveyData);
  wsSurvey['!cols'] = calculateColumnWidths(surveyData);

  // -------------------------------------------------------------
  // ASSEMBLE WORKBOOK & EXPORT
  // -------------------------------------------------------------
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, wsMaster, 'Activities Master');
  XLSX.utils.book_append_sheet(workbook, wsSubtasks, 'Subtasks & QA Hold Points');
  XLSX.utils.book_append_sheet(workbook, wsResources, 'Resource Allocations');
  if (surveyRows.length > 0) {
    XLSX.utils.book_append_sheet(workbook, wsSurvey, 'Survey & Spans');
  }

  // Generate binary array
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const filename = `constructfield_activities_master_${filenameSuffix ? filenameSuffix + '_' : ''}${dateStr}.xlsx`;

  return await saveOrShareFile({
    filename,
    blob,
    title: 'Constructfield Activities Master Excel Report',
    text: `Constructfield Master Activities Report - ${currentDate}`
  });
}
