import { Activity, Equipment, Employee, TaskEquipmentAssignment, TaskLabourAssignment } from '../types';

export type ResourceConflictType = 
  | 'EQUIPMENT_CLASH' 
  | 'EQUIPMENT_MAINTENANCE' 
  | 'OPERATOR_CLASH' 
  | 'LABOUR_OVERALLOCATED';

export interface ResourceConflict {
  id: string;
  type: ResourceConflictType;
  severity: 'CRITICAL' | 'WARNING';
  resourceId: string;
  resourceName: string;
  category?: string;
  conflictingActivityId?: string;
  conflictingActivityName?: string;
  overlapStartDate?: string;
  overlapEndDate?: string;
  overlapDays?: number;
  message: string;
  details?: string;
}

export interface ActivityResourceVitality {
  status: 'OPTIMAL' | 'CONFLICT' | 'MAINTENANCE' | 'WARNING';
  label: string;
  color: 'green' | 'red' | 'amber' | 'blue';
  badgeClass: string;
  conflicts: ResourceConflict[];
  equipmentCount: number;
  labourCount: number;
  hasEquipmentClash: boolean;
  hasMaintenanceIssue: boolean;
  hasOperatorClash: boolean;
  hasLabourClash: boolean;
}

/**
 * Normalizes string date to Date object safely
 */
function parseDateSafe(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Formats Date to YYYY-MM-DD string
 */
function formatDateSafe(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Deterministic Date Range Overlap calculation:
 * max(StartA, StartB) <= min(FinishA, FinishB)
 */
export function calculateDateOverlap(
  startAStr?: string, 
  finishAStr?: string, 
  startBStr?: string, 
  finishBStr?: string
): { overlap: boolean; overlapStart: string; overlapEnd: string; overlapDays: number } {
  const today = new Date().toISOString().split('T')[0];
  const sA = parseDateSafe(startAStr || today);
  const fA = parseDateSafe(finishAStr || startAStr || today);
  const sB = parseDateSafe(startBStr || today);
  const fB = parseDateSafe(finishBStr || startBStr || today);

  // Normalise so finish is not before start
  const startA = sA <= fA ? sA : fA;
  const finishA = fA >= sA ? fA : sA;
  const startB = sB <= fB ? sB : fB;
  const finishB = fB >= sB ? fB : sB;

  const overlapStart = startA > startB ? startA : startB;
  const overlapEnd = finishA < finishB ? finishA : finishB;

  if (overlapStart.getTime() <= overlapEnd.getTime()) {
    const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
    const overlapDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return {
      overlap: true,
      overlapStart: formatDateSafe(overlapStart),
      overlapEnd: formatDateSafe(overlapEnd),
      overlapDays
    };
  }

  return {
    overlap: false,
    overlapStart: '',
    overlapEnd: '',
    overlapDays: 0
  };
}

/**
 * Extracts and aggregates all equipment assignments from an activity and its subtasks
 */
export function extractActivityEquipment(activity: Activity): TaskEquipmentAssignment[] {
  const result: TaskEquipmentAssignment[] = [];
  const seen = new Set<string>();

  // Direct assignments
  (activity.assignedEquipment || []).forEach(eq => {
    const key = (eq.equipmentId || eq.name || eq.id || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(eq);
    }
  });

  // Subtask assignments
  (activity.subtasks || []).forEach(s => {
    const subEqs = [...(s.assignedEquipmentList || []), ...(s.assignedEquipment ? [s.assignedEquipment] : [])];
    subEqs.forEach(eqName => {
      if (!eqName || typeof eqName !== 'string' || eqName.trim() === '') return;
      const key = eqName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: `TEA-SUB-${s.id}-${key}`,
          equipmentId: key,
          name: eqName,
          operator: 'Assigned Operator',
          startDate: s.startDate || activity.startDate
        });
      }
    });
  });

  return result;
}

/**
 * Extracts and aggregates all labour assignments from an activity and its subtasks
 */
export function extractActivityLabour(activity: Activity): TaskLabourAssignment[] {
  const result: TaskLabourAssignment[] = [];
  const seen = new Set<string>();

  (activity.assignedLabour || []).forEach(l => {
    const key = (l.name || l.employeeId || l.id || '').toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(l);
    }
  });

  (activity.subtasks || []).forEach(s => {
    const workers = [
      ...(s.assignedWorkers || []),
      ...(s.assignedPerson ? s.assignedPerson.split(',').map(p => p.trim()) : [])
    ];
    workers.forEach(wName => {
      if (!wName || typeof wName !== 'string' || wName.trim() === '' || wName.includes(',')) return;
      const key = wName.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: `TLA-SUB-${s.id}-${key}`,
          name: wName,
          role: s.category || 'Site Worker',
          hours: 8,
          startDate: s.startDate || activity.startDate
        });
      }
    });
  });

  return result;
}

/**
 * Deterministic Engine: Finds all resource, plant, and operator conflicts for a target activity relative to other activities.
 */
export function findActivityResourceConflicts(
  activity: Activity,
  allActivities: Activity[],
  allEquipment: Equipment[] = [],
  allEmployees: Employee[] = []
): ActivityResourceVitality {
  const conflicts: ResourceConflict[] = [];
  const assignedEquipment = extractActivityEquipment(activity);
  const assignedLabour = extractActivityLabour(activity);

  const actStartDate = activity.startDate || new Date().toISOString().split('T')[0];
  const actFinishDate = activity.finishDate || activity.startDate || actStartDate;

  // 1. Check Equipment Status (Maintenance / Breakdown)
  assignedEquipment.forEach(eqAssign => {
    const matchedEquip = allEquipment.find(e => 
      (eqAssign.equipmentId && (e.id === eqAssign.equipmentId || (e as any).equipmentId === eqAssign.equipmentId)) ||
      (eqAssign.name && e.name.toLowerCase().trim() === eqAssign.name.toLowerCase().trim())
    );

    if (matchedEquip) {
      const statusLower = (matchedEquip.status || '').toLowerCase();
      const isDown = statusLower === 'maintenance' || 
                     statusLower === 'breakdown' || 
                     statusLower === 'under repair' || 
                     statusLower === 'out of service' ||
                     statusLower === 'decommissioned';

      if (isDown) {
        conflicts.push({
          id: `CONF-MAINT-${activity.id}-${matchedEquip.id}`,
          type: 'EQUIPMENT_MAINTENANCE',
          severity: 'CRITICAL',
          resourceId: matchedEquip.id,
          resourceName: matchedEquip.name,
          category: matchedEquip.type || matchedEquip.category || 'Plant',
          message: `${matchedEquip.name} is currently flagged as "${matchedEquip.status}" in Fleet Register.`,
          details: `Assigned plant unit [${matchedEquip.id || 'N/A'}] is undergoing maintenance or repair.`
        });
      }
    }
  });

  // 2. Check for Contention with other active/scheduled activities
  const activeActivities = (allActivities || []).filter(other => 
    other.id !== activity.id && 
    other.status !== 'Completed' &&
    other.status !== 'Blocked'
  );

  activeActivities.forEach(otherAct => {
    const otherStartDate = otherAct.startDate || new Date().toISOString().split('T')[0];
    const otherFinishDate = otherAct.finishDate || otherAct.startDate || otherStartDate;

    const overlapResult = calculateDateOverlap(actStartDate, actFinishDate, otherStartDate, otherFinishDate);
    if (!overlapResult.overlap) return;

    const otherEquipList = extractActivityEquipment(otherAct);
    const otherLabourList = extractActivityLabour(otherAct);

    // Equipment Clashes
    assignedEquipment.forEach(eqAssign => {
      const isClashing = otherEquipList.some(otherEq => {
        const idMatch = eqAssign.equipmentId && otherEq.equipmentId && (
          eqAssign.equipmentId.toLowerCase() === otherEq.equipmentId.toLowerCase() ||
          eqAssign.equipmentId.toLowerCase() === otherEq.name.toLowerCase()
        );
        const nameMatch = eqAssign.name && otherEq.name && 
          eqAssign.name.toLowerCase().trim() === otherEq.name.toLowerCase().trim();
        return idMatch || nameMatch;
      });

      if (isClashing) {
        // Prevent duplicate conflict records for same pair
        const conflictKey = `CONF-EQ-${activity.id}-${otherAct.id}-${eqAssign.name}`;
        if (!conflicts.some(c => c.id === conflictKey)) {
          conflicts.push({
            id: conflictKey,
            type: 'EQUIPMENT_CLASH',
            severity: 'CRITICAL',
            resourceId: eqAssign.equipmentId || eqAssign.name,
            resourceName: eqAssign.name,
            conflictingActivityId: otherAct.id,
            conflictingActivityName: otherAct.name,
            overlapStartDate: overlapResult.overlapStart,
            overlapEndDate: overlapResult.overlapEnd,
            overlapDays: overlapResult.overlapDays,
            message: `Double-booked with "${otherAct.name}" (${otherAct.id}) for ${overlapResult.overlapDays} day(s).`,
            details: `Concurrent booking window: ${overlapResult.overlapStart} → ${overlapResult.overlapEnd}. Both activities require ${eqAssign.name}.`
          });
        }
      }
    });

    // Operator Clashes (Same operator assigned to different machines on same day)
    assignedEquipment.forEach(eqAssign => {
      if (!eqAssign.operator || eqAssign.operator.toLowerCase() === 'assigned operator') return;
      const opName = eqAssign.operator.toLowerCase().trim();

      const clashingOther = otherEquipList.find(otherEq => 
        otherEq.operator && 
        otherEq.operator.toLowerCase().trim() === opName &&
        (otherEq.name.toLowerCase().trim() !== eqAssign.name.toLowerCase().trim() ||
         otherEq.equipmentId !== eqAssign.equipmentId)
      );

      if (clashingOther) {
        const conflictKey = `CONF-OP-${activity.id}-${otherAct.id}-${opName}`;
        if (!conflicts.some(c => c.id === conflictKey)) {
          conflicts.push({
            id: conflictKey,
            type: 'OPERATOR_CLASH',
            severity: 'WARNING',
            resourceId: opName,
            resourceName: `Operator: ${eqAssign.operator}`,
            conflictingActivityId: otherAct.id,
            conflictingActivityName: otherAct.name,
            overlapStartDate: overlapResult.overlapStart,
            overlapEndDate: overlapResult.overlapEnd,
            overlapDays: overlapResult.overlapDays,
            message: `Operator ${eqAssign.operator} is simultaneously driving ${clashingOther.name} on "${otherAct.name}".`,
            details: `Operator schedule conflict on dates ${overlapResult.overlapStart} → ${overlapResult.overlapEnd}.`
          });
        }
      }
    });

    // Key Labour Over-allocation Clashes
    assignedLabour.forEach(labAssign => {
      if (!labAssign.name || labAssign.name.toLowerCase() === 'site worker') return;
      const wName = labAssign.name.toLowerCase().trim();

      const clashingLabour = otherLabourList.find(otherLab => 
        otherLab.name && otherLab.name.toLowerCase().trim() === wName
      );

      if (clashingLabour) {
        const conflictKey = `CONF-LAB-${activity.id}-${otherAct.id}-${wName}`;
        if (!conflicts.some(c => c.id === conflictKey)) {
          conflicts.push({
            id: conflictKey,
            type: 'LABOUR_OVERALLOCATED',
            severity: 'WARNING',
            resourceId: labAssign.employeeId || labAssign.name,
            resourceName: labAssign.name,
            conflictingActivityId: otherAct.id,
            conflictingActivityName: otherAct.name,
            overlapStartDate: overlapResult.overlapStart,
            overlapEndDate: overlapResult.overlapEnd,
            overlapDays: overlapResult.overlapDays,
            message: `${labAssign.name} is also scheduled on "${otherAct.name}".`,
            details: `Personnel multi-task allocation between ${overlapResult.overlapStart} → ${overlapResult.overlapEnd}.`
          });
        }
      }
    });
  });

  // Calculate Overall Living Vitality
  const hasEquipmentClash = conflicts.some(c => c.type === 'EQUIPMENT_CLASH');
  const hasMaintenanceIssue = conflicts.some(c => c.type === 'EQUIPMENT_MAINTENANCE');
  const hasOperatorClash = conflicts.some(c => c.type === 'OPERATOR_CLASH');
  const hasLabourClash = conflicts.some(c => c.type === 'LABOUR_OVERALLOCATED');

  if (hasEquipmentClash || hasMaintenanceIssue) {
    const clashCount = conflicts.filter(c => c.type === 'EQUIPMENT_CLASH' || c.type === 'EQUIPMENT_MAINTENANCE').length;
    return {
      status: 'CONFLICT',
      label: hasMaintenanceIssue && !hasEquipmentClash 
        ? `${clashCount} Machine in Repair` 
        : `${clashCount} Plant Clash${clashCount > 1 ? 'es' : ''}`,
      color: 'red',
      badgeClass: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
      conflicts,
      equipmentCount: assignedEquipment.length,
      labourCount: assignedLabour.length,
      hasEquipmentClash,
      hasMaintenanceIssue,
      hasOperatorClash,
      hasLabourClash
    };
  }

  if (hasOperatorClash || hasLabourClash) {
    const warningCount = conflicts.filter(c => c.type === 'OPERATOR_CLASH' || c.type === 'LABOUR_OVERALLOCATED').length;
    return {
      status: 'WARNING',
      label: `${warningCount} Crew Conflict${warningCount > 1 ? 's' : ''}`,
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      conflicts,
      equipmentCount: assignedEquipment.length,
      labourCount: assignedLabour.length,
      hasEquipmentClash,
      hasMaintenanceIssue,
      hasOperatorClash,
      hasLabourClash
    };
  }

  if (assignedEquipment.length === 0 && assignedLabour.length === 0) {
    return {
      status: 'OPTIMAL',
      label: 'No Plant Allocated',
      color: 'blue',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      conflicts: [],
      equipmentCount: 0,
      labourCount: 0,
      hasEquipmentClash: false,
      hasMaintenanceIssue: false,
      hasOperatorClash: false,
      hasLabourClash: false
    };
  }

  return {
    status: 'OPTIMAL',
    label: `${assignedEquipment.length} Plant • Clear`,
    color: 'green',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    conflicts: [],
    equipmentCount: assignedEquipment.length,
    labourCount: assignedLabour.length,
    hasEquipmentClash: false,
    hasMaintenanceIssue: false,
    hasOperatorClash: false,
    hasLabourClash: false
  };
}

/**
 * Finds alternative available equipment units from the fleet that have NO active date clashes
 */
export function getAvailableAlternativeEquipment(
  allEquipment: Equipment[],
  allActivities: Activity[],
  startDate: string,
  finishDate: string,
  currentEquipmentIdOrName?: string,
  preferredCategory?: string
): Array<{ equipment: Equipment; isSameCategory: boolean; statusBadge: string }> {
  const currentNormalized = (currentEquipmentIdOrName || '').toLowerCase().trim();

  // Find all equipment that are not out-of-service
  const candidates = (allEquipment || []).filter(eq => {
    const isCurrent = (eq.id && eq.id.toLowerCase() === currentNormalized) ||
                      (eq.name && eq.name.toLowerCase().trim() === currentNormalized);
    if (isCurrent) return false;

    const statusLower = (eq.status || '').toLowerCase();
    const isDown = statusLower === 'maintenance' || 
                   statusLower === 'breakdown' || 
                   statusLower === 'under repair' || 
                   statusLower === 'decommissioned';
    return !isDown;
  });

  const activeActivities = (allActivities || []).filter(a => a.status !== 'Completed' && a.status !== 'Blocked');

  // Filter out any equipment that is booked by another activity during [startDate, finishDate]
  const availableList: Array<{ equipment: Equipment; isSameCategory: boolean; statusBadge: string }> = [];

  candidates.forEach(eq => {
    const eqId = (eq.id || '').toLowerCase();
    const eqName = (eq.name || '').toLowerCase().trim();

    const isBooked = activeActivities.some(act => {
      const overlap = calculateDateOverlap(startDate, finishDate, act.startDate, act.finishDate);
      if (!overlap.overlap) return false;

      const actEquips = extractActivityEquipment(act);
      return actEquips.some(ae => 
        (ae.equipmentId && ae.equipmentId.toLowerCase() === eqId) ||
        (ae.name && ae.name.toLowerCase().trim() === eqName)
      );
    });

    if (!isBooked) {
      const eqCategory = eq.type || eq.category || '';
      const isSameCategory = Boolean(
        preferredCategory && 
        eqCategory.toLowerCase().includes(preferredCategory.toLowerCase())
      );

      availableList.push({
        equipment: eq,
        isSameCategory,
        statusBadge: eq.status || 'Available'
      });
    }
  });

  // Sort same category first, then alphabetical
  availableList.sort((a, b) => {
    if (a.isSameCategory && !b.isSameCategory) return -1;
    if (!a.isSameCategory && b.isSameCategory) return 1;
    return a.equipment.name.localeCompare(b.equipment.name);
  });

  return availableList;
}
