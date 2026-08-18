import { TaskLabourAssignment, Employee, LabourLog, SubTaskMeasurementType } from '../types';

/**
 * Robustly classifies a subtask into its correct SubTaskMeasurementType
 * based on explicit type, structural flags, units of measurement, or task title/category semantics.
 */
export function inferSubtaskMeasurementType(st?: {
  measurementType?: SubTaskMeasurementType;
  unit?: string;
  isHoldPoint?: boolean;
  isMilestone?: boolean;
  checklist?: any[];
  title?: string;
  category?: string;
}): SubTaskMeasurementType {
  if (!st) return 'Quantity';

  // 1. Explicit valid measurement type if already recorded
  if (st.measurementType) return st.measurementType;

  // 2. Structural & Quality hold point flags
  if (st.isHoldPoint || (st.unit && st.unit.toLowerCase() === 'sign-off')) return 'Sign-off';
  if (st.isMilestone || (st.unit && st.unit.toLowerCase() === 'checkpoint')) return 'Milestone';
  if (st.checklist && st.checklist.length > 0) return 'Checklist';

  // 3. Unit-based classification
  const u = (st.unit || '').trim().toLowerCase();
  if (u === '%' || u === 'percent' || u === 'percentage') return 'Percentage';
  if (u === 'done' || u === 'yes/no' || u === 'boolean') return 'Yes/No';
  if (['m', 'km', 'cm', 'mm', 'ft', 'yd', 'lin.m', 'meter', 'meters', 'metre', 'metres', 'linear m', 'lin m', 'linear metre', 'linear meter'].includes(u)) {
    return 'Length';
  }
  if (['m²', 'm2', 'sqm', 'sq.m', 'ha', 'hectare', 'hectares', 'sq ft', 'sq.ft', 'sq yd', 'acres', 'acre'].includes(u)) {
    return 'Area';
  }
  if (['m³', 'm3', 'cum', 'cu.m', 'l', 'litre', 'litres', 'liter', 'liters', 'cu yd', 'cu ft', 'gallons', 'gal'].includes(u)) {
    return 'Volume';
  }
  if (['tons', 'ton', 't', 'kg', 'kgs', 'lbs', 'tonne', 'tonnes'].includes(u)) {
    return 'Weight';
  }
  if (['poles', 'panels', 'fixtures', 'joints', 'pipes', 'manholes', 'items', 'valves'].includes(u)) {
    return 'Count';
  }

  // 4. Title and category heuristics
  const text = `${st.title || ''} ${st.category || ''}`.toLowerCase();

  // QA Inspection & Hold Point Gate keywords
  if (
    text.includes('inspection') ||
    text.includes('sign-off') ||
    text.includes('sign off') ||
    text.includes('qa gate') ||
    text.includes('quality hold') ||
    text.includes('audit check') ||
    text.includes('test certificate') ||
    text.includes('probing inspection')
  ) {
    return 'Sign-off';
  }

  // Milestone keywords
  if (
    text.includes('milestone') ||
    text.includes('checkpoint') ||
    text.includes('stage gate') ||
    text.includes('handover')
  ) {
    return 'Milestone';
  }

  // Volume deliverables
  if (
    text.includes('bedding') ||
    text.includes('sand layer') ||
    text.includes('concrete pour') ||
    text.includes('blinding') ||
    text.includes('backfill') ||
    text.includes('compaction') ||
    text.includes('aggregate') ||
    text.includes('crushed stone')
  ) {
    return 'Volume';
  }

  // Area deliverables
  if (
    text.includes('paving') ||
    text.includes('surfacing') ||
    text.includes('clearing') ||
    text.includes('topsoil stripping') ||
    text.includes('plastering') ||
    text.includes('painting') ||
    text.includes('formwork assembly')
  ) {
    return 'Area';
  }

  // Weight deliverables
  if (
    text.includes('rebar') ||
    text.includes('reinforcement') ||
    text.includes('structural steel') ||
    text.includes('asphalt hot mix')
  ) {
    return 'Weight';
  }

  // Linear Distance & Trenching deliverables
  if (
    text.includes('trench') ||
    text.includes('corridor') ||
    text.includes('pipeline') ||
    text.includes('conduit') ||
    text.includes('cable') ||
    text.includes('cables') ||
    text.includes('fibre') ||
    text.includes('fiber') ||
    text.includes('set-out') ||
    text.includes('pegging') ||
    text.includes('marking') ||
    text.includes('fencing') ||
    text.includes('kerb') ||
    text.includes('pulling') ||
    text.includes('laying') ||
    text.includes('span') ||
    text.includes('duct assembly')
  ) {
    return 'Length';
  }

  return 'Quantity';
}

/**
 * Returns safe 1-2 character uppercase initials for avatars (e.g. "DM" for "Dimi Maphanga"),
 * preventing visual overlap when long or multi-word names are parsed.
 */
export function getPersonInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'W';
  // Remove special characters, commas, semicolons
  const clean = name.replace(/[,;]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'W';
  if (parts.length === 1) {
    return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalizes, expands comma-separated groups, and deduplicates an activity's assignedLabour array.
 * This guarantees that single composite strings (e.g., "Dimi, Refumuni, Matume...") become clean individual entries
 * and duplicate worker entries are removed.
 */
export function normalizeLabourAssignments(
  assignments?: TaskLabourAssignment[],
  employees?: Employee[]
): TaskLabourAssignment[] {
  if (!assignments || assignments.length === 0) return [];

  const result: TaskLabourAssignment[] = [];
  const seenKeys = new Set<string>();

  assignments.forEach((item, index) => {
    if (!item || !item.name) return;

    const rawName = item.name.trim();

    // Check if the assignment is a concatenated/comma-separated list of names
    if (rawName.includes(',')) {
      const splitNames = rawName.split(',').map(s => s.trim()).filter(Boolean);
      splitNames.forEach((singleName, sIdx) => {
        const key = singleName.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          const empMatch = employees?.find(e => `${e.firstName} ${e.lastName}`.toLowerCase() === key);
          result.push({
            id: empMatch ? `TLA-${empMatch.id}` : `TLA-SPLIT-${Date.now()}-${index}-${sIdx}`,
            employeeId: empMatch?.id || undefined,
            name: empMatch ? `${empMatch.firstName} ${empMatch.lastName}` : singleName,
            role: empMatch?.position || (item.role && !item.role.includes(',') ? item.role : 'Site Worker'),
            hours: Number(item.hours) || 8,
            startDate: item.startDate || new Date().toISOString().split('T')[0],
            notes: item.notes
          });
        }
      });
    } else {
      const key = rawName.toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        // Look up employee by ID or name to keep metadata pristine
        const empMatch = item.employeeId 
          ? employees?.find(e => e.id === item.employeeId)
          : employees?.find(e => `${e.firstName} ${e.lastName}`.toLowerCase() === key);

        result.push({
          ...item,
          id: item.id || `TLA-${item.employeeId || Date.now()}-${index}`,
          employeeId: empMatch?.id || item.employeeId,
          name: empMatch ? `${empMatch.firstName} ${empMatch.lastName}` : rawName,
          role: item.role || empMatch?.position || 'Site Worker',
          hours: Number(item.hours) || 8,
          startDate: item.startDate || new Date().toISOString().split('T')[0]
        });
      }
    }
  });

  return result;
}

/**
 * Checks whether an employee is already assigned to a task (by ID or full name match)
 */
export function isEmployeeAlreadyAssigned(
  assignments: TaskLabourAssignment[] = [],
  employeeId?: string,
  workerName?: string
): boolean {
  if (!assignments || assignments.length === 0) return false;
  const targetId = employeeId?.trim();
  const targetName = workerName?.trim().toLowerCase();

  return assignments.some(a => {
    if (targetId && a.employeeId && a.employeeId === targetId) return true;
    if (targetName && a.name.toLowerCase() === targetName) return true;
    return false;
  });
}

/**
 * Checks whether hours have already been logged for a worker on a given date for an activity.
 * Prevents double-logging.
 */
export function getLoggedHoursForWorker(
  logs: LabourLog[] = [],
  activityId: string,
  workerName: string,
  dateStr?: string
): { isLogged: boolean; hours: number; logId?: string } {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  const targetName = workerName?.trim().toLowerCase();

  const matchingLogs = logs.filter(l => 
    l.activityId === activityId &&
    l.date === targetDate &&
    l.workerName?.trim().toLowerCase() === targetName
  );

  if (matchingLogs.length === 0) {
    return { isLogged: false, hours: 0 };
  }

  const totalHours = matchingLogs.reduce((acc, l) => acc + (Number(l.hoursWorked ?? l.hours) || 0), 0);
  return { isLogged: true, hours: totalHours, logId: matchingLogs[0].id };
}

/**
 * Computes a clean WBS progression sequence index for a subtask (e.g. "1.0", "2.0", "3.0" or "1.1" for nested children).
 */
export function getSubtaskProgressionNumber(
  subtasks: { id: string; parentId?: string }[] = [],
  currentIndex: number
): string {
  if (!subtasks || currentIndex < 0 || currentIndex >= subtasks.length) {
    return `${currentIndex + 1}.0`;
  }

  const current = subtasks[currentIndex];
  if (!current) return `${currentIndex + 1}.0`;

  if (!current.parentId) {
    // Count top-level tasks before this one
    let topLevelCount = 0;
    for (let i = 0; i <= currentIndex; i++) {
      if (!subtasks[i].parentId) {
        topLevelCount++;
      }
    }
    return `${topLevelCount}.0`;
  } else {
    // Find parent index and topLevelCount
    const parentIdx = subtasks.findIndex(s => s.id === current.parentId);
    if (parentIdx === -1) return `${currentIndex + 1}.0`;

    let parentTopLevel = 0;
    for (let i = 0; i <= parentIdx; i++) {
      if (!subtasks[i].parentId) {
        parentTopLevel++;
      }
    }

    // Count sibling children under this parent up to currentIndex
    let childIndex = 0;
    for (let i = 0; i <= currentIndex; i++) {
      if (subtasks[i].parentId === current.parentId) {
        childIndex++;
      }
    }

    return `${parentTopLevel}.${childIndex}`;
  }
}
